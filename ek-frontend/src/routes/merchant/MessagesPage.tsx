import { ChatPage } from "../../components/chat/ChatPage";
import { PageHeader } from "../../components/ui/PageHeader";
import { CURRENT_MERCHANT } from "../../components/layout/MerchantLayout";
import { users } from "../../mock/db";

export function MerchantMessagesPage() {
  const m = CURRENT_MERCHANT;
  const owner = users.find((u) => u.id === m.owner_user_id)!;
  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Reply to customers about their orders, and raise issues with platform support"
      />
      <ChatPage
        kinds={["customer_merchant", "merchant_support"]}
        selfId={owner.id}
        selfName={m.business_name}
        selfRole="merchant"
        selfHue={m.logo_hue}
        emptyHint="Customers can message you from an order or a product page."
      />
    </div>
  );
}
