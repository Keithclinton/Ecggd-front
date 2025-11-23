export function isProfileComplete(user: any) {
  if (!user || !user.profile) return false;
  const required = [
    user.first_name,
    user.last_name,
    user.phone,
    user.profile.date_of_birth,
    user.profile.gender,
    user.profile.address,
    user.profile.nationality,
    user.profile.field_of_study,
  ];
  return required.every(Boolean);
}

export function getProfileCompletion(user: any): number {
  if (!user) return 0;
  const required = [
    user.first_name,
    user.last_name,
    user.phone,
    user.profile?.date_of_birth,
    user.profile?.gender,
    user.profile?.address,
    user.profile?.nationality,
    user.profile?.field_of_study,
  ];
  const completed = required.filter(Boolean).length;
  return Math.round((completed / required.length) * 100);
}

export function userInitials(user: any) {
  if (!user) return '';
  const fn = user.first_name || '';
  const ln = user.last_name || '';
  const initials = (fn[0] || '') + (ln[0] || '');
  return initials.toUpperCase();
}
