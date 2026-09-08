import { ChatPage } from "../../components/chat/ChatPage";
import { PageHeader } from "../../components/ui/PageHeader";
import { customers } from "../../mock/db";

export function CustomerMessagesPage() {
  const me = customers[0]!;
  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Chat with merchants about your orders, or with our support team"
      />
      <ChatPage
        kinds={["customer_merchant", "customer_support"]}
        selfId={me.id}
        selfName={`${me.first_name} ${me.last_name}`}
        selfRole="customer"
        selfHue={me.avatar_hue}
        emptyHint="Open a product or order and choose 'Message merchant' to start a thread."
      />
    </div>
  );
}
