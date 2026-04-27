import { useState } from 'react';
import onboardingService from '../../services/onboardingService';
import FormInput from '../../components/FormInput';

const OffboardingForm = () => {
  const [employeeId, setEmployeeId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onboardingService.create({
      employeeId,
      type: 'offboarding'
    });
    alert('Offboarding processed');
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormInput
        label="Employee ID"
        value={employeeId}
        onChange={setEmployeeId}
      />
      <button type="submit">Confirm Offboarding</button>
    </form>
  );
};

export default OffboardingForm;