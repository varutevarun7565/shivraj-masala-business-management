interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="page-hd">
      <div className="page-hd-left">
        <h1 className="page-hd-title">{title}</h1>
        {subtitle && <p className="page-hd-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-hd-actions">{actions}</div>}
    </div>
  );
}
