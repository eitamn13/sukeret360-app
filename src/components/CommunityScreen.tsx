const handleSend = async () => {
  if (!message.trim()) return;

  const userMessage = message;
  let aiReply = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      console.error("Server error:", response.status);
      aiReply = "השרת לא זמין כרגע 😔";
    } else {
      const data = await response.json();
      aiReply = data.reply || "לא הצלחתי לענות 😔";
    }
  } catch (error) {
    console.error("Fetch error:", error);
    aiReply = "שגיאת חיבור 😢";
  }

  const newPost = {
    id: Date.now(),
    name: "אתה",
    initials: "את",
    avatarColor: "#6366F1",
    time: "עכשיו",
    text: userMessage,
    likes: 0,
    replies: 0,
  };

  const aiPost = {
    id: Date.now() + 1,
    name: "עוזרת חכמה",
    initials: "AI",
    avatarColor: "#E11D48",
    time: "עכשיו",
    text: aiReply,
    likes: 0,
    replies: 0,
  };

  setPosts((prev) => [newPost, aiPost, ...prev]);
  setMessage("");
};
