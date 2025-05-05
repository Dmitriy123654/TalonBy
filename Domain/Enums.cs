namespace Domain
{
    public enum HospitalType
    {
        Adult,
        Children,
        Specialized
    }
    public enum Gender
    {
        Male,
        Female
    }
    public enum RoleOfUser
    {
        Patient,
        Doctor,
        ChiefDoctor,
        Administrator,
        SystemAnalyst,
        MedicalStaff
    }
    public enum Status
    {
        Completed,
        Waiting,
        Cancelled
    }

    public enum BloodType
    {
        APositive,
        ANegative,
        BPositive, 
        BNegative,
        ABPositive,
        ABNegative,
        OPositive,
        ONegative
    }

    public enum AllergySeverity
    {
        Low,
        Medium,
        High
    }
}
