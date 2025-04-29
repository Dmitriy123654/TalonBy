using Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace DAL
{
    public class ApplicationContext : DbContext
    {
        public ApplicationContext(DbContextOptions<ApplicationContext> options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<MedicalAppointment> MedicalAppointments { get; set; }
        public DbSet<Hospital> Hospitals { get; set; }
        public DbSet<ReceptionStatus> ReceptionStatuses { get; set; }
        public DbSet<DoctorsSpeciality> DoctorsSpecialities { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<VerificationCode> VerificationCodes { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<TimeSlot> TimeSlots { get; set; }
        public DbSet<DoctorScheduleSettings> DoctorScheduleSettings { get; set; }
        public DbSet<AppointmentMedicalDetails> AppointmentMedicalDetails { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
           optionsBuilder.UseSqlServer(@"Server=(localdb)\mssqllocaldb;Database=TalonBy;Trusted_Connection=True;");

        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Patient>()
                .HasOne(p => p.User)
                .WithMany(u => u.Patients)
                .HasForeignKey(p => p.UserId);

            modelBuilder.Entity<MedicalAppointment>()
                .HasOne(ma => ma.Hospital)
                .WithMany(h => h.MedicalAppointments)
                .HasForeignKey(ma => ma.HospitalId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MedicalAppointment>()
                .HasOne(ma => ma.Doctor)
                .WithMany(d => d.MedicalAppointments)
                .HasForeignKey(ma => ma.DoctorId);

            modelBuilder.Entity<AppointmentMedicalDetails>()
                .HasOne(amd => amd.MedicalAppointment)
                .WithOne(ma => ma.MedicalDetails)
                .HasForeignKey<AppointmentMedicalDetails>(amd => amd.MedicalAppointmentId);

            modelBuilder.Entity<Doctor>()
                .HasOne(d => d.DoctorsSpeciality)
                .WithMany(ds => ds.Doctors)
                .HasForeignKey(d => d.DoctorsSpecialityId);

            modelBuilder.Entity<Doctor>()
                .HasOne(d => d.Hospital)
                .WithMany(h => h.Doctors)
                .HasForeignKey(d => d.HospitalId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TimeSlot>()
                .HasOne(ts => ts.Doctor)
                .WithMany()
                .HasForeignKey(ts => ts.DoctorId);

            modelBuilder.Entity<TimeSlot>()
                .HasOne(ts => ts.Hospital)
                .WithMany()
                .HasForeignKey(ts => ts.HospitalId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);

            modelBuilder.Entity<DoctorScheduleSettings>()
                .HasOne(dss => dss.Doctor)
                .WithMany()
                .HasForeignKey(dss => dss.DoctorId);
        }
    }
}
