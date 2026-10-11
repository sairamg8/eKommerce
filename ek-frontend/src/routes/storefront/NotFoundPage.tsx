import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import s from "./NotFoundPage.module.css";

const QUICK_LINKS = [
  {
    to: "/products",
    icon: "grid",
    title: "Browse catalogue",
    desc: "Explore products across all categories and merchants",
  },
  {
    to: "/track",
    icon: "truck",
    title: "Track a shipment",
    desc: "Check live package status using your AWB number",
  },
  {
    to: "/support",
    icon: "info",
    title: "Help & support",
    desc: "Get help with an order, return, or account issue",
  },
];

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className={s.wrap}>
      <Card>
        <div className={s.hero}>
          <div className={s.iconWrap}>
            <Icon name="boxOpen" size={26} />
          </div>
          <span className={s.code}>404 · Page not found</span>
          <h1 className={s.h1}>We couldn&apos;t find that page</h1>
          <p className={s.sub}>
            The link you followed may be broken, expired, or the page may have
            been moved to another address.
          </p>

          <div className={s.actions}>
            <Button onClick={() => navigate("/")}>
              <Icon name="home" size={15} /> Back to home
            </Button>
            <Button variant="secondary" onClick={() => navigate("/products")}>
              <Icon name="grid" size={15} /> Browse products
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <Icon name="arrowLeft" size={15} /> Go back
            </Button>
          </div>
        </div>

        <div className={s.links}>
          {QUICK_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className={s.linkCard}>
              <span className={s.linkIco}>
                <Icon name={item.icon} size={17} />
              </span>
              <div className={s.linkBody}>
                <span className={s.linkTitle}>
                  {item.title} <Icon name="chevronRight" size={13} />
                </span>
                <span className={s.linkDesc}>{item.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

