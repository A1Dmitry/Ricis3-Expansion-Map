import React, { Children, isValidElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CircleDot, ExternalLink, type LucideIcon } from 'lucide-react';

/** Read translated labels without depending on the current language or DOM mutations. */
export function buttonText(children: ReactNode): string {
  return Children.toArray(children).map(child => {
    if (typeof child === 'string' || typeof child === 'number') return String(child);
    if (!isValidElement<{ children?: ReactNode; 'aria-hidden'?: boolean | string }>(child)) return '';
    if (child.props['aria-hidden'] === true || child.props['aria-hidden'] === 'true') return '';
    return buttonText(child.props.children);
  }).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

/** Keep existing conditional Lucide icons (including loading/selected states). */
function childIcon(children: ReactNode): ReactNode {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ children?: ReactNode }>(child)) continue;
    const type = child.type as { render?: { displayName?: string } };
    if (child.type === 'svg' || type?.render?.displayName) return child;
    const nested = childIcon(child.props.children);
    if (nested) return nested;
  }
  return null;
}

export interface IconButtonProps extends React.ComponentPropsWithRef<'button'> {
  /** Classic menus retain visible labels; toolbar commands remain icon-only. */
  presentation?: 'icon' | 'menu' | 'menubar';
  /** Explicit fallback for legacy text-only commands. Existing child icons take precedence. */
  fallbackIcon?: LucideIcon;
}

function useIconTooltip(description: string) {
  const [anchor, setAnchor] = React.useState<DOMRect | null>(null);
  const tooltipId = React.useId();
  const hide = () => setAnchor(null);

  React.useEffect(() => {
    if (!anchor) return;
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') hide(); };
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      window.removeEventListener('keydown', escape);
    };
  }, [anchor]);

  return { anchor, tooltipId, setAnchor, hide, tooltip: anchor && description && createPortal(
      <div id={tooltipId} role="tooltip" className="icon-button-tooltip" style={{
        left: Math.max(8, Math.min(anchor.left, window.innerWidth - Math.min(320, window.innerWidth - 16) - 8)),
        ...(anchor.top > window.innerHeight / 2
          ? { bottom: window.innerHeight - anchor.top + 8 }
          : { top: anchor.bottom + 8 }),
      }}>{description}</div>, document.body) };
}

/** Fixed-size command surface. Full labels live in a viewport-safe, keyboard-accessible tooltip. */
export function IconButton({ children, fallbackIcon: Fallback = CircleDot, className = '',
  title, 'aria-label': ariaLabel, onPointerEnter, onPointerLeave, onFocus, onBlur, onKeyDown, onClick,
  style, type = 'button', presentation = 'icon', ...props }: IconButtonProps) {
  const text = buttonText(children);
  const label = ariaLabel || (/^[✕×+−→←-]$/.test(text) ? title : text) || title || text;
  const description = title?.startsWith(label || '\0') ? title : [label, title].filter(Boolean).join(' — ');
  const { anchor, tooltipId, setAnchor, hide, tooltip } = useIconTooltip(description);

  const showTooltip = presentation === 'icon' || Boolean(title && title !== label);

  return <>
    <button {...props} type={type} aria-label={label} title={props['aria-expanded'] === true ? undefined : title || description}
      aria-describedby={[props['aria-describedby'], anchor ? tooltipId : null].filter(Boolean).join(' ') || undefined}
      className={`${presentation === 'icon' ? 'icon-button' : presentation === 'menu' ? 'menu-command' : 'menubar-command'} ${className}`} style={style}
      onPointerEnter={event => { if (showTooltip) setAnchor(event.currentTarget.getBoundingClientRect()); onPointerEnter?.(event); }}
      onPointerLeave={event => { hide(); onPointerLeave?.(event); }}
      onFocus={event => { if (showTooltip) setAnchor(event.currentTarget.getBoundingClientRect()); onFocus?.(event); }}
      onBlur={event => { hide(); onBlur?.(event); }}
      onClick={event => { hide(); onClick?.(event); }}
      onKeyDown={event => { if (event.key === 'Escape') hide(); onKeyDown?.(event); }}
    >
      {presentation === 'icon' ? <>
        {text && <span className="icon-button__label">{text}</span>}
        <span className="icon-button__glyph" aria-hidden="true">{childIcon(children) || <Fallback size={18} />}</span>
      </> : <>
        {presentation === 'menu' && !childIcon(children) && <Fallback size={16} aria-hidden="true" />}
        {children}
      </>}
    </button>
    {tooltip}
  </>;
}

export interface IconLinkProps extends React.ComponentPropsWithRef<'a'> {
  fallbackIcon?: LucideIcon;
}

/** External/navigation actions stay links (open in new tab, copy URL, etc.). */
export function IconLink({ children, fallbackIcon: Fallback = ExternalLink, className = '',
  title, 'aria-label': ariaLabel, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props }: IconLinkProps) {
  const text = buttonText(children);
  const label = ariaLabel || text || title;
  const description = title?.startsWith(label || '\0') ? title : [label, title].filter(Boolean).join(' — ');
  const { anchor, tooltipId, setAnchor, hide, tooltip } = useIconTooltip(description);
  return <>
    <a {...props} className={`icon-button ${className}`} title={title || description} aria-label={label}
      aria-describedby={[props['aria-describedby'], anchor ? tooltipId : null].filter(Boolean).join(' ') || undefined}
      onPointerEnter={event => { setAnchor(event.currentTarget.getBoundingClientRect()); onPointerEnter?.(event); }}
      onPointerLeave={event => { hide(); onPointerLeave?.(event); }}
      onFocus={event => { setAnchor(event.currentTarget.getBoundingClientRect()); onFocus?.(event); }}
      onBlur={event => { hide(); onBlur?.(event); }}>
      {text && <span className="icon-button__label">{text}</span>}
      <span className="icon-button__glyph" aria-hidden="true">{childIcon(children) || <Fallback size={18} />}</span>
    </a>
    {tooltip}
  </>;
}
