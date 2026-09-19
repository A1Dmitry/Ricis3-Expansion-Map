import React from 'react';

/** Labelled actions, tabs and disclosure headers preserve their content and layout.
 * Unlike toolbar icons, they must never be reduced to a fixed-size square. */
export function ContentButton({ className = '', type = 'button', ...props }: React.ComponentPropsWithRef<'button'>) {
  return <button {...props} type={type} className={`content-button ${className}`} />;
}

/** A list/card is one labelled selection target, not duplicated content plus an anonymous icon. */
export function SelectionCard(props: React.ComponentPropsWithRef<'button'>) {
  return <ContentButton {...props} data-control-kind="selection" />;
}

/** References and navigation links keep their titles visible and retain native link behavior. */
export function ContentLink({ className = '', ...props }: React.ComponentPropsWithRef<'a'>) {
  return <a {...props} className={`content-link ${className}`} />;
}
