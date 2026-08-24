export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  titleLevel = 1,
  className = '',
}) {
  const Heading = titleLevel === 2 ? 'h2' : 'h1'

  return (
    <header className={`page-header${className ? ` ${className}` : ''}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Heading>{title}</Heading>
      {description && <p className="page-header-description">{description}</p>}
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  )
}

