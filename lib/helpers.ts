export function isProfileComplete(user: any) {
  if (!user) return false;
  const required = [
    user.first_name,
    user.last_name,
    user.phone_number,
    user.date_of_birth,
    user.gender,
    user.address,
  ];
  return required.every(Boolean);
}

export function userInitials(user: any) {
  if (!user) return '';
  const fn = user.first_name || '';
  const ln = user.last_name || '';
  const initials = (fn[0] || '') + (ln[0] || '');
  return initials.toUpperCase();
}
