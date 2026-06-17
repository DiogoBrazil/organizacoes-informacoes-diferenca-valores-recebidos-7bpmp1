import { FileText, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";

import PageHeader from "../components/PageHeader";

const cards = [
  {
    to: "/usuarios",
    title: "Usuários",
    description: "Gerenciar usuários do sistema",
    icon: Users,
  },
  {
    to: "/policiais",
    title: "Policiais Militares",
    description: "Cadastrar e gerenciar policiais",
    icon: Shield,
  },
  {
    to: "/requerimentos",
    title: "Requerimentos",
    description: "Gerenciar requerimentos de diferenças",
    icon: FileText,
  },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Painel Inicial"
        subtitle="Acesse os módulos administrativos do sistema."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.to}
              to={card.to}
              className="focus-ring rounded border border-slate-200 bg-white p-5 shadow-sm transition hover:border-gov-secondary hover:shadow-md"
            >
              <Icon className="h-8 w-8 text-gov-primary" />
              <h3 className="mt-4 text-lg font-bold">{card.title}</h3>
              <p className="mt-1 text-sm text-gov-muted">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
