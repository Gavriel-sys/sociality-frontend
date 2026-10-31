import type { EditProfileInput } from "./use-edit-profile";

export function buildProfileRequestBody(input: EditProfileInput): FormData | Record<string, unknown> {
  const fields = { name: input.name, bio: input.bio };
  if (input.avatar instanceof File) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value);
    });
    formData.append("avatar", input.avatar);
    return formData;
  }
  return Object.fromEntries(
    Object.entries({ ...fields, avatar: input.avatar }).filter(([, value]) => value !== undefined),
  );
}
