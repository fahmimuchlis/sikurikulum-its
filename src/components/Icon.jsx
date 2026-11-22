/**
 * Icon — wrapper Material Symbols Outlined dari Google Fonts.
 * Gunakan nama icon persis dari fonts.google.com/icons
 * Contoh: <Icon name="dashboard" /> <Icon name="search" size={20} />
 */
export default function Icon({ name, size = 20, weight = 300, fill = 0, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        userSelect: 'none',
        ...style,
      }}
    >
      {name}
    </span>
  );
}
