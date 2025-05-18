using System;
using System.Collections.Generic;

namespace Domain.ViewModels.Statistics
{
    /// <summary>
    /// Модель представления рекомендаций по оптимизации расписания
    /// </summary>
    public class ScheduleOptimizationViewModel
    {
        /// <summary>
        /// Наличие периодов высокой загруженности (80%+)
        /// </summary>
        public bool HasHighOccupancyPeriods { get; set; }

        /// <summary>
        /// Наличие периодов низкой загруженности (менее 20%)
        /// </summary>
        public bool HasLowOccupancyPeriods { get; set; }

        /// <summary>
        /// Рекомендации по часам с высокой загруженностью
        /// </summary>
        public List<HourlyOptimizationViewModel> HourlyOptimizations { get; set; } = new List<HourlyOptimizationViewModel>();

        /// <summary>
        /// Рекомендации по дням недели с высокой загруженностью
        /// </summary>
        public List<WeekdayOptimizationViewModel> WeekdayOptimizations { get; set; } = new List<WeekdayOptimizationViewModel>();

        /// <summary>
        /// Общие рекомендации по оптимизации длительности приема
        /// </summary>
        public SlotDurationOptimizationViewModel SlotDurationOptimization { get; set; } = new SlotDurationOptimizationViewModel();

        /// <summary>
        /// Эффект от применения оптимизаций (в процентах)
        /// </summary>
        public double EstimatedImpactPercentage { get; set; }

        /// <summary>
        /// Текстовое описание эффекта от оптимизации
        /// </summary>
        public string ImpactDescription { get; set; }
        
        /// <summary>
        /// Текущая средняя длительность приема в минутах
        /// </summary>
        public int CurrentSlotDuration { get; set; }
        
        /// <summary>
        /// Рекомендуемая длительность приема в минутах
        /// </summary>
        public int RecommendedSlotDuration { get; set; }

        /// <summary>
        /// Информация о тенденциях загруженности для анализа
        /// </summary>
        public OptimizationTrendsViewModel Trends { get; set; }
    }

    /// <summary>
    /// Модель представления рекомендаций по оптимизации для конкретного часа
    /// </summary>
    public class HourlyOptimizationViewModel
    {
        /// <summary>
        /// Часовой интервал
        /// </summary>
        public string Hour { get; set; }

        /// <summary>
        /// Текущая загруженность (%)
        /// </summary>
        public double CurrentOccupancyRate { get; set; }

        /// <summary>
        /// Рекомендуемая длительность приема в минутах
        /// </summary>
        public int RecommendedSlotDuration { get; set; }

        /// <summary>
        /// Прогнозируемая загруженность после оптимизации (%)
        /// </summary>
        public double ExpectedOccupancyRate { get; set; }
    }

    /// <summary>
    /// Модель представления рекомендаций по оптимизации для конкретного дня недели
    /// </summary>
    public class WeekdayOptimizationViewModel
    {
        /// <summary>
        /// День недели (номер 1-7)
        /// </summary>
        public int DayOfWeek { get; set; }

        /// <summary>
        /// Название дня недели
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Текущая загруженность (%)
        /// </summary>
        public double CurrentOccupancyRate { get; set; }

        /// <summary>
        /// Рекомендуемая длительность приема в минутах
        /// </summary>
        public int RecommendedSlotDuration { get; set; }

        /// <summary>
        /// Прогнозируемая загруженность после оптимизации (%)
        /// </summary>
        public double ExpectedOccupancyRate { get; set; }
    }

    /// <summary>
    /// Модель представления рекомендаций по оптимизации длительности приема
    /// </summary>
    public class SlotDurationOptimizationViewModel
    {
        /// <summary>
        /// Требуется ли изменение длительности приема
        /// </summary>
        public bool OptimizationRequired { get; set; }

        /// <summary>
        /// Текущая длительность приема в минутах
        /// </summary>
        public int CurrentDuration { get; set; }

        /// <summary>
        /// Рекомендуемая длительность приема в минутах
        /// </summary>
        public int RecommendedDuration { get; set; }

        /// <summary>
        /// Тип оптимизации
        /// </summary>
        public OptimizationTypeEnum Type { get; set; }
        
        /// <summary>
        /// Описание рекомендации на естественном языке
        /// </summary>
        public string Description { get; set; }
    }

    /// <summary>
    /// Модель представления тенденций загруженности для анализа
    /// </summary>
    public class OptimizationTrendsViewModel 
    {
        /// <summary>
        /// Изменение общей загруженности в процентах
        /// </summary>
        public double OccupancyTrend { get; set; }
        
        /// <summary>
        /// Описание тенденции на естественном языке
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Тренды по часам
        /// </summary>
        public List<HourlyTrendViewModel> HourlyTrends { get; set; } = new List<HourlyTrendViewModel>();

        /// <summary>
        /// Тренды по дням недели
        /// </summary>
        public List<WeekdayTrendViewModel> WeekdayTrends { get; set; } = new List<WeekdayTrendViewModel>();
    }

    /// <summary>
    /// Модель представления тенденций по часам
    /// </summary>
    public class HourlyTrendViewModel
    {
        /// <summary>
        /// Часовой интервал
        /// </summary>
        public string Hour { get; set; }
        
        /// <summary>
        /// Изменение загруженности в процентах
        /// </summary>
        public double Trend { get; set; }
        
        /// <summary>
        /// Флаг роста загруженности
        /// </summary>
        public bool IsGrowing { get; set; }
        
        /// <summary>
        /// Флаг снижения загруженности
        /// </summary>
        public bool IsDecreasing { get; set; }
        
        /// <summary>
        /// Флаг стабильно высокой загруженности
        /// </summary>
        public bool StableHighLoad { get; set; }
        
        /// <summary>
        /// Флаг стабильно низкой загруженности
        /// </summary>
        public bool StableLowLoad { get; set; }
    }

    /// <summary>
    /// Модель представления тенденций по дням недели
    /// </summary>
    public class WeekdayTrendViewModel
    {
        /// <summary>
        /// День недели (номер 1-7)
        /// </summary>
        public int DayOfWeek { get; set; }
        
        /// <summary>
        /// Название дня недели
        /// </summary>
        public string Name { get; set; }
        
        /// <summary>
        /// Изменение загруженности в процентах
        /// </summary>
        public double Trend { get; set; }
        
        /// <summary>
        /// Флаг роста загруженности
        /// </summary>
        public bool IsGrowing { get; set; }
        
        /// <summary>
        /// Флаг снижения загруженности
        /// </summary>
        public bool IsDecreasing { get; set; }
        
        /// <summary>
        /// Флаг стабильно высокой загруженности
        /// </summary>
        public bool StableHighLoad { get; set; }
        
        /// <summary>
        /// Флаг стабильно низкой загруженности
        /// </summary>
        public bool StableLowLoad { get; set; }
    }

    /// <summary>
    /// Перечисление типов оптимизации
    /// </summary>
    public enum OptimizationTypeEnum
    {
        /// <summary>
        /// Уменьшение длительности приема
        /// </summary>
        Decrease,
        
        /// <summary>
        /// Увеличение длительности приема
        /// </summary>
        Increase,
        
        /// <summary>
        /// Оптимизация не требуется
        /// </summary>
        NoChange
    }
} 