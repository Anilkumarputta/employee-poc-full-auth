import React from "react";
import { MessagesPage } from "./MessagesPage";
import type { AppPage } from "../types/navigation";

type MessagingInboxProps = {
  onNavigate?: (page: AppPage) => void;
};

const MessagingInbox: React.FC<MessagingInboxProps> = () => {
  return <MessagesPage />;
};

export default MessagingInbox;
