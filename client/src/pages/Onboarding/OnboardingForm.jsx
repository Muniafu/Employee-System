import { useState } from 'react';
import onboardingService from '../../services/onboardingService';
import FormInput from '../../components/FormInput';

const OnboardingForm = () => {
  const [form, setForm] = useState({ employeeId: '', notes: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onboardingService.create({
      ...form,
      type: 'onboarding'
  });
    alert('Onboarding created');
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormInput
        label="Employee ID"
        value={form.employeeId}
        onChange={(v) => setForm({ ...form, employeeId: v })}
      />
      <FormInput
        label="Notes"
        value={form.notes}
        onChange={(v) => setForm({ ...form, notes: v })}
      />
      <button type="submit">Submit</button>
    </form>
  );
};

export default OnboardingForm;