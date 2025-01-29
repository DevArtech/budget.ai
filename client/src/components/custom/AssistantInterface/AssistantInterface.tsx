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
import styles from "./AssistantInterface.module.css";

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

          // Only add/update message if we have actual content
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage?.role === "assistant") {
              // Update existing assistant message
              lastMessage.content = assistantMessage;
              return newMessages;
            } else {
              // Add new assistant message
              return [...newMessages, { role: "assistant", content: assistantMessage }];
            }
          });
          // Remove loading state once we start getting actual content
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
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
          className={`${styles.assistantButton} assistant-button`}
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className={styles.sheetContent}>
        <SheetHeader>
          <SheetTitle>AI Assistant</SheetTitle>
        </SheetHeader>
        <ScrollArea ref={scrollAreaRef} className={styles.scrollArea}>
          <div className={styles.messageContainer}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.messageWrapper} ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`${styles.message} ${
                    message.role === "assistant" ? styles.assistantMessage : styles.userMessage
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={styles.loadingMessage}>
                <div className={styles.loadingBubble}>
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className={styles.actionContainer}>
          {actionMessages.length > 0 && (
            <div className={styles.actionText}>
              {actionMessages.map((action) => (
                <div key={action.id} className={styles.actionMessage}>
                  {action.text}
                </div>
              ))}
            </div>
          )}
          <div className={styles.inputContainer}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className={styles.clearButton}
              title="Clear chat"
            >
              <Trash2 className={styles.iconSize} />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              disabled={isLoading}
              className={styles.messageInput}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send className={styles.iconSize} />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
