import { FormControl, FormGroup } from '@angular/forms';
import { applyServerErrors } from './form-errors';

describe('applyServerErrors', () => {
  function buildForm() {
    return new FormGroup({ title: new FormControl(''), description: new FormControl('') });
  }

  it('puts the first message of each field on the matching control and marks it touched', () => {
    const form = buildForm();

    const unmapped = applyServerErrors(form, { title: ['Too short', 'Other'] });

    expect(form.controls.title.errors).toEqual({ server: 'Too short' });
    expect(form.controls.title.touched).toBe(true);
    expect(form.controls.description.errors).toBeNull();
    expect(unmapped).toEqual([]);
  });

  it('returns the messages of fields that do not exist in the form', () => {
    const form = buildForm();

    const unmapped = applyServerErrors(form, { status: ['Unknown status'] });

    expect(unmapped).toEqual(['Unknown status']);
  });

  it('does not fail when the server sends no field errors', () => {
    expect(applyServerErrors(buildForm(), undefined)).toEqual([]);
  });
});
