import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ActionMessage {
  id: number;
  text: string;
  timestamp: number;
}

export function AssistantInterface() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessages, setActionMessages] = useState<ActionMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Clean up action messages that are older than 5 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      setActionMessages((prev) =>
        prev.filter((msg) => now - msg.timestamp < 5000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setActionMessages([]);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/assistant/chat?message=${encodeURIComponent(
          userMessage
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      let assistantMessage = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);

        // Check for action messages
        const actionMatch = text.match(/<\|(.*?)\|>/);
        if (actionMatch) {
          setActionMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: actionMatch[1],
              timestamp: Date.now(),
            },
          ]);
        } else {
          assistantMessage += text;

          // Update the message in real-time
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              lastMessage.content = assistantMessage;
            }
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/assistant/clear", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to clear chat history");
      }

      setMessages([]);
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full p-0 assistant-button"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="flex h-full w-full flex-col gap-4 sm:max-w-[400px]"
        style={{ zIndex: 99999 }}
      >
        <SheetHeader>
          <SheetTitle>AI Assistant</SheetTitle>
        </SheetHeader>
        <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
          <div className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.role === "assistant"
                      ? "bg-zinc-100 dark:bg-zinc-800 text-black"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="animate-pulse rounded-lg bg-zinc-100 px-4 py-2 dark:bg-zinc-800 text-black">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex flex-col gap-2">
          {actionMessages.length > 0 && (
            <div className="action-text text-sm text-muted-foreground bg-muted py-1 rounded">
              {actionMessages.map((action) => (
                <div key={action.id} className="text-center">
                  {action.text}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-9 w-9 bg-black"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              disabled={isLoading}
              style={{ color: "black" }}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
