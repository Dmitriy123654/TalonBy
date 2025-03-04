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

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
           optionsBuilder.UseSqlServer(@"Server=(localdb)\mssqllocaldb;Database=TalonBy;Trusted_Connection=True;");

        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .HasOne(u => u.Patient)
                .WithOne(p => p.User)
                .HasForeignKey<Patient>(p => p.UserId);

            modelBuilder.Entity<MedicalAppointment>()
                .HasOne(ma => ma.Hospital)
                .WithMany(h => h.MedicalAppointments)
                .HasForeignKey(ma => ma.HospitalId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MedicalAppointment>()
                .HasOne(ma => ma.Doctor)
                .WithMany(d => d.MedicalAppointments)
                .HasForeignKey(ma => ma.DoctorId);

            modelBuilder.Entity<MedicalAppointment>()
                .HasOne(ma => ma.ReceptionStatus)
                .WithMany(rs => rs.MedicalAppointments)
                .HasForeignKey(ma => ma.ReceptionStatusId);

            modelBuilder.Entity<Doctor>()
                .HasOne(d => d.DoctorsSpeciality)
                .WithMany(ds => ds.Doctors)
                .HasForeignKey(d => d.DoctorsSpecialityId);

            modelBuilder.Entity<Doctor>()
                .HasOne(d => d.Hospital)
                .WithMany(h => h.Doctors)
                .HasForeignKey(d => d.HospitalId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
