export interface Hospital {
  hospitalId: number;
  name: string;
  address: string;
  type: HospitalType;
  workingHours: string;
  phones: string;
  email?: string;
  description?: string;
}

export enum HospitalType {
  Adult = 0,
  Children = 1,
  Specialized = 2
} 