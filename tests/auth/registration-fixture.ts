import { fireEvent, screen } from "@testing-library/react";

export const registrationValues = {
  name: "Taylor Mason", username: "tmason", email: "taylor@example.com",
  phone: "08123456789", password: "Password123!", confirmPassword: "Password123!",
};

export const registrationResponse = {
  success: true, message: "Registered",
  data: {
    token: "jwt-tmason-token",
    user: { id: "u-journey-1", name: "Taylor Mason", username: "tmason", email: "taylor@example.com" },
  },
};

const registrationLabels = {
  name: "Name", username: "Username", email: "Email", phone: "Number Phone",
  password: "Password", confirmPassword: "Confirm Password",
};

export function fillRegistrationForm(overrides: Partial<typeof registrationValues> = {}): void {
  const values = { ...registrationValues, ...overrides };
  for (const name of Object.keys(registrationLabels) as Array<keyof typeof registrationLabels>) {
    fireEvent.change(screen.getByLabelText(registrationLabels[name]), { target: { value: values[name] } });
  }
}
