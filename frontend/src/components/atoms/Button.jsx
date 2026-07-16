export default function Button({
  children,
  variant = 'primary', // primary | secondary | ghost
  size = 'base', // base | sm
  loading = false,
  block = false,
  disabled = false,
  type = 'button',
  onClick,
  icon,
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    block ? 'btn-block' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} onClick={onClick}>
      {loading ? <span className={`spinner ${variant !== 'primary' ? 'dark' : ''}`} /> : icon}
      {children}
    </button>
  )
}
