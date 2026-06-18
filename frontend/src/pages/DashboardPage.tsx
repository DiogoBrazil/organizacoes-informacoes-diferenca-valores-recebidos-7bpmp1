import { ArrowRight, FileText, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";

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
      <div className="mb-7">
        <h2 className="font-display text-2xl font-bold tracking-tight text-gov-text sm:text-3xl">
          Bem-vindo ao sistema
        </h2>
        <p className="mt-1 text-sm text-gov-muted">
          Selecione um módulo para começar a gerenciar os registros.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.to}
              to={card.to}
              className="focus-ring group surface-card relative overflow-hidden p-5 transition-colors duration-200 hover:border-gov-primary/40 hover:shadow-card"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gov-primary transition-transform duration-200 group-hover:scale-x-100"
              />
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gov-primary/15 bg-gov-primary/10 text-gov-primary transition-colors group-hover:bg-gov-primary group-hover:text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-gov-text">
                {card.title}
              </h3>
              <p className="mt-1 text-sm text-gov-muted">{card.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gov-primary opacity-0 transition-opacity group-hover:opacity-100">
                Acessar
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
