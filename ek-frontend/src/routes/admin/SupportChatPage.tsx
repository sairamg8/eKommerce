import { ChatPage } from "../../components/chat/ChatPage";
import { PageHeader } from "../../components/ui/PageHeader";
import { adminUser } from "../../mock/db";

export function AdminSupportChatPage() {
  return (
    <div>
      <PageHeader
        title="Live support"
        subtitle="Merchants raising account issues, and customers escalated to a live agent"
      />
      <ChatPage
        kinds={["merchant_support", "customer_support"]}
        selfId={adminUser.id}
        selfName="Platform Support"
        selfRole="admin"
        selfHue={250}
        emptyHint="Threads appear here when a merchant or customer opens one."
      />
    </div>
  );
}
