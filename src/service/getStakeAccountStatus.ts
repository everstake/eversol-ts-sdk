export default (activationEpoch: number, currentEpoch: number, deactivationEpoch: number) => {
  const deactivationNumber = 18446744073709551615;

  if (activationEpoch === currentEpoch && deactivationEpoch === deactivationNumber) {
    return 'Activating';
  }

  if (deactivationEpoch === currentEpoch) {
    return 'Deactivating';
  }

  if (deactivationEpoch === deactivationNumber && activationEpoch < currentEpoch) {
    return 'Active';
  }

  if (deactivationEpoch < currentEpoch) {
    return 'Deactivated';
  }

  return 'Initialize';
};
