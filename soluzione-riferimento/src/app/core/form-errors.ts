import { FormGroup } from '@angular/forms';

/**
 * Puts the per-field messages returned by the server (400) on the matching controls.
 * Returns the messages that do not belong to any control, so the caller can show them elsewhere.
 */
export function applyServerErrors(form: FormGroup, errors: Record<string, string[]> | undefined): string[] {
  const unmapped: string[] = [];
  for (const [field, messages] of Object.entries(errors ?? {})) {
    const control = form.get(field);
    if (control) {
      control.setErrors({ server: messages[0] });
      control.markAsTouched();
    } else {
      unmapped.push(...messages);
    }
  }
  return unmapped;
}
