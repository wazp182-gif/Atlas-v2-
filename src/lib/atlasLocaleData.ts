import {
  LocaleCultureEntry,
  PlatformProbeSnapshot,
  DocFxConfiguration,
  DiataxisPageValidation
} from '../types/atlasKnowledge';

export const ATLAS_LOCALE_DATABASE: LocaleCultureEntry[] = [
  {
    locale: 'af',
    number_decimal_separator: ',',
    short_date_pattern: 'yyyy-MM-dd',
    long_date_pattern: 'dddd dd MMMM yyyy',
    short_time_pattern: 'HH:mm',
    long_time_pattern: 'HH:mm:ss',
    am_designator: 'vm.',
    pm_designator: 'nm.',
    month_names_raw: [
      'Januarie', 'Februarie', 'Maart', 'April', 'Mei', 'Junie',
      'Julie', 'Augustus', 'September', 'Oktober', 'November', 'Desember'
    ],
    dates: [
      { ref: '2015-01-01', short: '2015-01-01', long: 'Donderdag 01 Januarie 2015', month_standalone: 'Januarie 2015' },
      { ref: '2015-02-03', short: '2015-02-03', long: 'Dinsdag 03 Februarie 2015', month_standalone: 'Februarie 2015' },
      { ref: '2022-01-25', short: '2022-01-25', long: 'Dinsdag 25 Januarie 2022', month_standalone: 'Januarie 2022' },
      { ref: '2020-02-29', short: '2020-02-29', long: 'Saterdag 29 Februarie 2020', month_standalone: 'Februarie 2020' },
      { ref: '2015-09-04', short: '2015-09-04', long: 'Vrydag 04 September 2015', month_standalone: 'September 2015' },
      { ref: '1979-11-07', short: '1979-11-07', long: 'Woensdag 07 November 1979', month_standalone: 'November 1979' },
      { ref: '2020-03-02', short: '2020-03-02', long: 'Maandag 02 Maart 2020', month_standalone: 'Maart 2020' },
      { ref: '2021-10-31', short: '2021-10-31', long: 'Sondag 31 Oktober 2021', month_standalone: 'Oktober 2021' },
      { ref: '2024-12-31', short: '2024-12-31', long: 'Dinsdag 31 Desember 2024', month_standalone: 'Desember 2024' }
    ],
    times: [
      { ref: '01:05', short: '01:05', long: '01:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'ar',
    number_decimal_separator: '٫',
    short_date_pattern: 'd‏/M‏/yyyy',
    long_date_pattern: 'dddd، d MMMM yyyy',
    short_time_pattern: 'h:mm tt',
    long_time_pattern: 'h:mm:ss tt',
    am_designator: 'ص',
    pm_designator: 'م',
    month_names_raw: [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ],
    dates: [
      { ref: '2015-01-01', short: '1/1/2015', long: 'الخميس، 1 يناير 2015', month_standalone: 'يناير 2015' },
      { ref: '2015-02-03', short: '3/2/2015', long: 'الثلاثاء، 3 فبراير 2015', month_standalone: 'فبراير 2015' },
      { ref: '2022-01-25', short: '25/1/2022', long: 'الثلاثاء، 25 يناير 2022', month_standalone: 'يناير 2022' },
      { ref: '2020-02-29', short: '29/2/2020', long: 'السبت، 29 فبراير 2020', month_standalone: 'فبراير 2020' },
      { ref: '2015-09-04', short: '4/9/2015', long: 'الجمعة، 4 سبتمبر 2015', month_standalone: 'سبتمبر 2015' },
      { ref: '1979-11-07', short: '7/11/1979', long: 'الأربعاء، 7 نوفمبر 1979', month_standalone: 'نوفمبر 1979' },
      { ref: '2020-03-02', short: '2/3/2020', long: 'الاثنين، 2 مارس 2020', month_standalone: 'مارس 2020' },
      { ref: '2021-10-31', short: '31/10/2021', long: 'الأحد، 31 أكتوبر 2021', month_standalone: 'أكتوبر 2021' },
      { ref: '2024-12-31', short: '31/12/2024', long: 'الثلاثاء، 31 ديسمبر 2024', month_standalone: 'ديسمبر 2024' }
    ],
    times: [
      { ref: '01:05', short: '1:05 ص', long: '1:05:00 ص' },
      { ref: '13:23', short: '1:23 م', long: '1:23:00 م' },
      { ref: '13:25', short: '1:25 م', long: '1:25:00 م' }
    ]
  },
  {
    locale: 'az',
    number_decimal_separator: ',',
    short_date_pattern: 'dd.MM.yyyy',
    long_date_pattern: 'd MMMM yyyy, dddd',
    short_time_pattern: 'HH:mm',
    long_time_pattern: 'HH:mm:ss',
    am_designator: 'AM',
    pm_designator: 'PM',
    month_names_raw: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
    dates: [
      { ref: '2015-01-01', short: '01.01.2015', long: '1 yanvar 2015, cümə axşamı', month_standalone: 'yanvar 2015' },
      { ref: '2015-02-03', short: '03.02.2015', long: '3 fevral 2015, çərşənbə axşamı', month_standalone: 'fevral 2015' },
      { ref: '2022-01-25', short: '25.01.2022', long: '25 yanvar 2022, çərşənbə axşamı', month_standalone: 'yanvar 2022' },
      { ref: '2020-02-29', short: '29.02.2020', long: '29 fevral 2020, şənbə', month_standalone: 'fevral 2020' },
      { ref: '2015-09-04', short: '04.09.2015', long: '4 sentyabr 2015, cümə', month_standalone: 'sentyabr 2015' },
      { ref: '1979-11-07', short: '07.11.1979', long: '7 noyabr 1979, çərşənbə', month_standalone: 'noyabr 1979' },
      { ref: '2020-03-02', short: '02.03.2020', long: '2 mart 2020, bazar ertəsi', month_standalone: 'mart 2020' },
      { ref: '2021-10-31', short: '31.10.2021', long: '31 oktyabr 2021, bazar', month_standalone: 'oktyabr 2021' },
      { ref: '2024-12-31', short: '31.12.2024', long: '31 dekabr 2024, çərşənbə axşamı', month_standalone: 'dekabr 2024' }
    ],
    times: [
      { ref: '01:05', short: '01:05', long: '01:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'bg',
    number_decimal_separator: ',',
    short_date_pattern: "d.MM.yyyy 'г'.",
    long_date_pattern: "dddd, d MMMM yyyy 'г'.",
    short_time_pattern: "H:mm 'ч'.",
    long_time_pattern: "H:mm:ss 'ч'.",
    am_designator: 'пр.об.',
    pm_designator: 'сл.об.',
    month_names_raw: ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'],
    dates: [
      { ref: '2015-01-01', short: '1.01.2015 г.', long: 'четвъртък, 1 януари 2015 г.', month_standalone: 'януари 2015' },
      { ref: '2015-02-03', short: '3.02.2015 г.', long: 'вторник, 3 февруари 2015 г.', month_standalone: 'февруари 2015' },
      { ref: '2022-01-25', short: '25.01.2022 г.', long: 'вторник, 25 януари 2022 г.', month_standalone: 'януари 2022' },
      { ref: '2020-02-29', short: '29.02.2020 г.', long: 'събота, 29 февруари 2020 г.', month_standalone: 'февруари 2020' },
      { ref: '2015-09-04', short: '4.09.2015 г.', long: 'петък, 4 септември 2015 г.', month_standalone: 'септември 2015' },
      { ref: '1979-11-07', short: '7.11.1979 г.', long: 'сряда, 7 ноември 1979 г.', month_standalone: 'ноември 1979' },
      { ref: '2020-03-02', short: '2.03.2020 г.', long: 'понеделник, 2 март 2020 г.', month_standalone: 'март 2020' },
      { ref: '2021-10-31', short: '31.10.2021 г.', long: 'неделя, 31 октомври 2021 г.', month_standalone: 'октомври 2021' },
      { ref: '2024-12-31', short: '31.12.2024 г.', long: 'вторник, 31 декември 2024 г.', month_standalone: 'декември 2024' }
    ],
    times: [
      { ref: '01:05', short: '1:05 ч.', long: '1:05:00 ч.' },
      { ref: '13:23', short: '13:23 ч.', long: '13:23:00 ч.' },
      { ref: '13:25', short: '13:25 ч.', long: '13:25:00 ч.' }
    ]
  },
  {
    locale: 'bn',
    number_decimal_separator: '.',
    short_date_pattern: 'd/M/yyyy',
    long_date_pattern: 'dddd, d MMMM, yyyy',
    short_time_pattern: 'h:mm tt',
    long_time_pattern: 'h:mm:ss tt',
    am_designator: 'AM',
    pm_designator: 'PM',
    month_names_raw: ['জানুয়ারী', 'ফেব্রুয়ারী', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
    dates: [
      { ref: '2015-01-01', short: '1/1/2015', long: 'বৃহস্পতিবার, 1 জানুয়ারী, 2015', month_standalone: 'জানুয়ারী 2015' },
      { ref: '2015-02-03', short: '3/2/2015', long: 'মঙ্গলবার, 3 ফেব্রুয়ারী, 2015', month_standalone: 'ফেব্রুয়ারী 2015' },
      { ref: '2022-01-25', short: '25/1/2022', long: 'মঙ্গলবার, 25 জানুয়ারী, 2022', month_standalone: 'জানুয়ারী 2022' },
      { ref: '2020-02-29', short: '29/2/2020', long: 'শনিবার, 29 ফেব্রুয়ারী, 2020', month_standalone: 'ফেব্রুয়ারী 2020' },
      { ref: '2015-09-04', short: '4/9/2015', long: 'শুক্রবার, 4 সেপ্টেম্বর, 2015', month_standalone: 'সেপ্টেম্বর 2015' },
      { ref: '1979-11-07', short: '7/11/1979', long: 'বুধবার, 7 নভেম্বর, 1979', month_standalone: 'নভেম্বর 1979' },
      { ref: '2020-03-02', short: '2/3/2020', long: 'সোমবার, 2 মার্চ, 2020', month_standalone: 'মার্চ 2020' },
      { ref: '2021-10-31', short: '31/10/2021', long: 'রবিবার, 31 অক্টোবর, 2021', month_standalone: 'অক্টোবর 2021' },
      { ref: '2024-12-31', short: '31/12/2024', long: 'মঙ্গলবার, 31 ডিসেম্বর, 2024', month_standalone: 'ডিসেম্বর 2024' }
    ],
    times: [
      { ref: '01:05', short: '1:05 AM', long: '1:05:00 AM' },
      { ref: '13:23', short: '1:23 PM', long: '1:23:00 PM' },
      { ref: '13:25', short: '1:25 PM', long: '1:25:00 PM' }
    ]
  },
  {
    locale: 'ca',
    number_decimal_separator: ',',
    short_date_pattern: 'd/M/yyyy',
    long_date_pattern: "dddd, d MMMM 'de' yyyy",
    short_time_pattern: 'H:mm',
    long_time_pattern: 'H:mm:ss',
    am_designator: 'a. m.',
    pm_designator: 'p. m.',
    month_names_raw: ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'],
    month_genitive_names_raw: ['de gener', 'de febrer', 'de març', 'd’abril', 'de maig', 'de juny', 'de juliol', 'd’agost', 'de setembre', 'd’octubre', 'de novembre', 'de desembre'],
    dates: [
      { ref: '2015-01-01', short: '1/1/2015', long: 'dijous, 1 de gener de 2015', month_standalone: 'gener 2015' },
      { ref: '2015-02-03', short: '3/2/2015', long: 'dimarts, 3 de febrer de 2015', month_standalone: 'febrer 2015' },
      { ref: '2022-01-25', short: '25/1/2022', long: 'dimarts, 25 de gener de 2022', month_standalone: 'gener 2022' },
      { ref: '2020-02-29', short: '29/2/2020', long: 'dissabte, 29 de febrer de 2020', month_standalone: 'febrer 2020' },
      { ref: '2015-09-04', short: '4/9/2015', long: 'divendres, 4 de setembre de 2015', month_standalone: 'setembre 2015' },
      { ref: '1979-11-07', short: '7/11/1979', long: 'dimecres, 7 de novembre de 1979', month_standalone: 'novembre 1979' },
      { ref: '2020-03-02', short: '2/3/2020', long: 'dilluns, 2 de març de 2020', month_standalone: 'març 2020' },
      { ref: '2021-10-31', short: '31/10/2021', long: 'diumenge, 31 d’octubre de 2021', month_standalone: 'octubre 2021' },
      { ref: '2024-12-31', short: '31/12/2024', long: 'dimarts, 31 de desembre de 2024', month_standalone: 'desembre 2024' }
    ],
    times: [
      { ref: '01:05', short: '1:05', long: '1:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'cs',
    number_decimal_separator: ',',
    short_date_pattern: 'dd.MM.yyyy',
    long_date_pattern: 'dddd d. MMMM yyyy',
    short_time_pattern: 'H:mm',
    long_time_pattern: 'H:mm:ss',
    am_designator: 'dop.',
    pm_designator: 'odp.',
    month_names_raw: ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'],
    month_genitive_names_raw: ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'],
    dates: [
      { ref: '2015-01-01', short: '01.01.2015', long: 'čtvrtek 1. ledna 2015', month_standalone: 'leden 2015' },
      { ref: '2015-02-03', short: '03.02.2015', long: 'úterý 3. února 2015', month_standalone: 'únor 2015' },
      { ref: '2022-01-25', short: '25.01.2022', long: 'úterý 25. ledna 2022', month_standalone: 'leden 2022' },
      { ref: '2020-02-29', short: '29.02.2020', long: 'sobota 29. února 2020', month_standalone: 'únor 2020' },
      { ref: '2015-09-04', short: '04.09.2015', long: 'pátek 4. září 2015', month_standalone: 'září 2015' },
      { ref: '1979-11-07', short: '07.11.1979', long: 'středa 7. listopadu 1979', month_standalone: 'listopad 1979' },
      { ref: '2020-03-02', short: '02.03.2020', long: 'pondělí 2. března 2020', month_standalone: 'březen 2020' },
      { ref: '2021-10-31', short: '31.10.2021', long: 'neděle 31. října 2021', month_standalone: 'říjen 2021' },
      { ref: '2024-12-31', short: '31.12.2024', long: 'úterý 31. prosince 2024', month_standalone: 'prosinec 2024' }
    ],
    times: [
      { ref: '01:05', short: '1:05', long: '1:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'de',
    number_decimal_separator: ',',
    short_date_pattern: 'dd.MM.yyyy',
    long_date_pattern: 'dddd, d. MMMM yyyy',
    short_time_pattern: 'HH:mm',
    long_time_pattern: 'HH:mm:ss',
    am_designator: 'AM',
    pm_designator: 'PM',
    month_names_raw: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    dates: [
      { ref: '2015-01-01', short: '01.01.2015', long: 'Donnerstag, 1. Januar 2015', month_standalone: 'Januar 2015' },
      { ref: '2015-02-03', short: '03.02.2015', long: 'Dienstag, 3. Februar 2015', month_standalone: 'Februar 2015' },
      { ref: '2022-01-25', short: '25.01.2022', long: 'Dienstag, 25. Januar 2022', month_standalone: 'Januar 2022' },
      { ref: '2020-02-29', short: '29.02.2020', long: 'Samstag, 29. Februar 2020', month_standalone: 'Februar 2020' },
      { ref: '2015-09-04', short: '04.09.2015', long: 'Freitag, 4. September 2015', month_standalone: 'September 2015' },
      { ref: '1979-11-07', short: '07.11.1979', long: 'Mittwoch, 7. November 1979', month_standalone: 'November 1979' },
      { ref: '2020-03-02', short: '02.03.2020', long: 'Montag, 2. März 2020', month_standalone: 'März 2020' },
      { ref: '2021-10-31', short: '31.10.2021', long: 'Sonntag, 31. Oktober 2021', month_standalone: 'Oktober 2021' },
      { ref: '2024-12-31', short: '31.12.2024', long: 'Dienstag, 31. Dezember 2024', month_standalone: 'Dezember 2024' }
    ],
    times: [
      { ref: '01:05', short: '01:05', long: '01:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'en-US',
    number_decimal_separator: '.',
    short_date_pattern: 'M/d/yyyy',
    long_date_pattern: 'dddd, MMMM d, yyyy',
    short_time_pattern: 'h:mm tt',
    long_time_pattern: 'h:mm:ss tt',
    am_designator: 'AM',
    pm_designator: 'PM',
    month_names_raw: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    dates: [
      { ref: '2015-01-01', short: '1/1/2015', long: 'Thursday, January 1, 2015', month_standalone: 'January 2015' },
      { ref: '2015-02-03', short: '2/3/2015', long: 'Tuesday, February 3, 2015', month_standalone: 'February 2015' },
      { ref: '2022-01-25', short: '1/25/2022', long: 'Tuesday, January 25, 2022', month_standalone: 'January 2022' },
      { ref: '2020-02-29', short: '2/29/2020', long: 'Saturday, February 29, 2020', month_standalone: 'February 2020' },
      { ref: '2015-09-04', short: '9/4/2015', long: 'Friday, September 4, 2015', month_standalone: 'September 2015' },
      { ref: '1979-11-07', short: '11/7/1979', long: 'Wednesday, November 7, 1979', month_standalone: 'November 1979' },
      { ref: '2020-03-02', short: '3/2/2020', long: 'Monday, March 2, 2020', month_standalone: 'March 2020' },
      { ref: '2021-10-31', short: '10/31/2021', long: 'Sunday, October 31, 2021', month_standalone: 'October 2021' },
      { ref: '2024-12-31', short: '12/31/2024', long: 'Tuesday, December 31, 2024', month_standalone: 'December 2024' }
    ],
    times: [
      { ref: '01:05', short: '1:05 AM', long: '1:05:00 AM' },
      { ref: '13:23', short: '1:23 PM', long: '1:23:00 PM' },
      { ref: '13:25', short: '1:25 PM', long: '1:25:00 PM' }
    ]
  },
  {
    locale: 'es',
    number_decimal_separator: ',',
    short_date_pattern: 'd/M/yyyy',
    long_date_pattern: "dddd, d 'de' MMMM 'de' yyyy",
    short_time_pattern: 'H:mm',
    long_time_pattern: 'H:mm:ss',
    am_designator: 'a. m.',
    pm_designator: 'p. m.',
    month_names_raw: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    dates: [
      { ref: '2015-01-01', short: '1/1/2015', long: 'jueves, 1 de enero de 2015', month_standalone: 'enero 2015' },
      { ref: '2015-02-03', short: '3/2/2015', long: 'martes, 3 de febrero de 2015', month_standalone: 'febrero 2015' },
      { ref: '2022-01-25', short: '25/1/2022', long: 'martes, 25 de enero de 2022', month_standalone: 'enero 2022' },
      { ref: '2020-02-29', short: '29/2/2020', long: 'sábado, 29 de febrero de 2020', month_standalone: 'febrero 2020' },
      { ref: '2015-09-04', short: '4/9/2015', long: 'viernes, 4 de septiembre de 2015', month_standalone: 'septiembre 2015' },
      { ref: '1979-11-07', short: '7/11/1979', long: 'miércoles, 7 de noviembre de 1979', month_standalone: 'noviembre 1979' },
      { ref: '2020-03-02', short: '2/3/2020', long: 'lunes, 2 de marzo de 2020', month_standalone: 'marzo 2020' },
      { ref: '2021-10-31', short: '31/10/2021', long: 'domingo, 31 de octubre de 2021', month_standalone: 'octubre 2021' },
      { ref: '2024-12-31', short: '31/12/2024', long: 'martes, 31 de diciembre de 2024', month_standalone: 'diciembre 2024' }
    ],
    times: [
      { ref: '01:05', short: '1:05', long: '1:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'fa',
    number_decimal_separator: '٫',
    short_date_pattern: 'yyyy/M/d',
    long_date_pattern: 'yyyy MMMM d, dddd',
    short_time_pattern: 'H:mm',
    long_time_pattern: 'H:mm:ss',
    am_designator: 'قبل‌ازتظهر',
    pm_designator: 'بعدازتظهر',
    month_names_raw: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
    dates: [
      { ref: '2015-01-01', short: '1393/10/11', long: '1393 دی 11, پنجشنبه', month_standalone: 'دی 1393' },
      { ref: '2015-02-03', short: '1393/11/14', long: '1393 بهمن 14, سه‌شنبه', month_standalone: 'بهمن 1393' },
      { ref: '2022-01-25', short: '1400/11/5', long: '1400 بهمن 5, سه‌شنبه', month_standalone: 'بهمن 1400' },
      { ref: '2020-02-29', short: '1398/12/10', long: '1398 اسفند 10, شنبه', month_standalone: 'اسفند 1398' },
      { ref: '2015-09-04', short: '1394/6/13', long: '1394 شهریور 13, جمعه', month_standalone: 'شهریور 1394' },
      { ref: '1979-11-07', short: '1358/8/16', long: '1358 آبان 16, چهارشنبه', month_standalone: 'آبان 1358' },
      { ref: '2020-03-02', short: '1398/12/12', long: '1398 اسفند 12, دوشنبه', month_standalone: 'اسفند 1398' },
      { ref: '2021-10-31', short: '1400/8/9', long: '1400 آبان 9, یکشنبه', month_standalone: 'آبان 1400' },
      { ref: '2024-12-31', short: '1403/10/11', long: '1403 دی 11, سه‌شنبه', month_standalone: 'دی 1403' }
    ],
    times: [
      { ref: '01:05', short: '1:05', long: '1:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'he',
    number_decimal_separator: '.',
    short_date_pattern: 'd.M.yyyy',
    long_date_pattern: 'dddd, d בMMMM yyyy',
    short_time_pattern: 'H:mm',
    long_time_pattern: 'H:mm:ss',
    am_designator: 'לפנה״צ',
    pm_designator: 'אחה״צ',
    month_names_raw: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
    dates: [
      { ref: '2015-01-01', short: '1.1.2015', long: 'יום חמישי, 1 בינואר 2015', month_standalone: 'ינואר 2015' },
      { ref: '2015-02-03', short: '3.2.2015', long: 'יום שלישי, 3 בפברואר 2015', month_standalone: 'פברואר 2015' },
      { ref: '2022-01-25', short: '25.1.2022', long: 'יום שלישי, 25 בינואר 2022', month_standalone: 'ינואר 2022' },
      { ref: '2020-02-29', short: '29.2.2020', long: 'יום שבת, 29 בפברואר 2020', month_standalone: 'פברואר 2020' },
      { ref: '2015-09-04', short: '4.9.2015', long: 'יום שישי, 4 בספטמבר 2015', month_standalone: 'ספטמבר 2015' },
      { ref: '1979-11-07', short: '7.11.1979', long: 'יום רביעי, 7 בנובמבר 1979', month_standalone: 'נובמבר 1979' },
      { ref: '2020-03-02', short: '2.3.2020', long: 'יום שני, 2 במרץ 2020', month_standalone: 'מרץ 2020' },
      { ref: '2021-10-31', short: '31.10.2021', long: 'יום ראשון, 31 באוקטובר 2021', month_standalone: 'אוקטובר 2021' },
      { ref: '2024-12-31', short: '31.12.2024', long: 'יום שלישי, 31 בדצמבר 2024', month_standalone: 'דצמבר 2024' }
    ],
    times: [
      { ref: '01:05', short: '1:05', long: '1:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'ja',
    number_decimal_separator: '.',
    short_date_pattern: 'yyyy/MM/dd',
    long_date_pattern: 'yyyy年M月d日dddd',
    short_time_pattern: 'H:mm',
    long_time_pattern: 'H:mm:ss',
    am_designator: '午前',
    pm_designator: '午後',
    month_names_raw: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    dates: [
      { ref: '2015-01-01', short: '2015/01/01', long: '2015年1月1日木曜日', month_standalone: '1月 2015' },
      { ref: '2015-02-03', short: '2015/02/03', long: '2015年2月3日火曜日', month_standalone: '2月 2015' },
      { ref: '2022-01-25', short: '2022/01/25', long: '2022年1月25日火曜日', month_standalone: '1月 2022' },
      { ref: '2020-02-29', short: '2020/02/29', long: '2020年2月29日土曜日', month_standalone: '2月 2020' },
      { ref: '2015-09-04', short: '2015/09/04', long: '2015年9月4日金曜日', month_standalone: '9月 2015' },
      { ref: '1979-11-07', short: '1979/11/07', long: '1979年11月7日水曜日', month_standalone: '11月 1979' },
      { ref: '2020-03-02', short: '2020/03/02', long: '2020年3月2日月曜日', month_standalone: '3月 2020' },
      { ref: '2021-10-31', short: '2021/10/31', long: '2021年10月31日日曜日', month_standalone: '10月 2021' },
      { ref: '2024-12-31', short: '2024/12/31', long: '2024年12月31日火曜日', month_standalone: '12月 2024' }
    ],
    times: [
      { ref: '01:05', short: '1:05', long: '1:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'ko',
    number_decimal_separator: '.',
    short_date_pattern: 'yyyy. M. d.',
    long_date_pattern: 'yyyy년 M월 d일 dddd',
    short_time_pattern: 'tt h:mm',
    long_time_pattern: 'tt h:mm:ss',
    am_designator: '오전',
    pm_designator: '오후',
    month_names_raw: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    dates: [
      { ref: '2015-01-01', short: '2015. 1. 1.', long: '2015년 1월 1일 목요일', month_standalone: '1월 2015' },
      { ref: '2015-02-03', short: '2015. 2. 3.', long: '2015년 2월 3일 화요일', month_standalone: '2월 2015' },
      { ref: '2022-01-25', short: '2022. 1. 25.', long: '2022년 1월 25일 화요일', month_standalone: '1월 2022' },
      { ref: '2020-02-29', short: '2020. 2. 29.', long: '2020년 2월 29일 토요일', month_standalone: '2월 2020' },
      { ref: '2015-09-04', short: '2015. 9. 4.', long: '2015년 9월 4일 금요일', month_standalone: '9월 2015' },
      { ref: '1979-11-07', short: '1979. 11. 7.', long: '1979년 11월 7일 수요일', month_standalone: '11월 1979' },
      { ref: '2020-03-02', short: '2020. 3. 2.', long: '2020년 3월 2일 월요일', month_standalone: '3월 2020' },
      { ref: '2021-10-31', short: '2021. 10. 31.', long: '2021년 10월 31일 일요일', month_standalone: '10월 2021' },
      { ref: '2024-12-31', short: '2024. 12. 31.', long: '2024년 12월 31일 화요일', month_standalone: '12월 2024' }
    ],
    times: [
      { ref: '01:05', short: '오전 1:05', long: '오전 1:05:00' },
      { ref: '13:23', short: '오후 1:23', long: '오후 1:23:00' },
      { ref: '13:25', short: '오후 1:25', long: '오후 1:25:00' }
    ]
  },
  {
    locale: 'ku',
    number_decimal_separator: '٫',
    short_date_pattern: 'yyyy-MM-dd',
    long_date_pattern: 'yyyy MMMM d, dddd',
    short_time_pattern: 'HH:mm',
    long_time_pattern: 'HH:mm:ss',
    am_designator: 'ب.ن',
    pm_designator: 'د.ن',
    month_names_raw: ['rêbendan', 'sibat', 'adar', 'nîsan', 'gulan', 'hezîran', 'tîrmeh', 'tebax', 'êlon', 'cotmeh', 'mijdar', 'berfanbar'],
    dates: [
      { ref: '2015-01-01', short: '2015-01-01', long: '2015 کانونی دووەم 1, پێنجشەممە', month_standalone: 'کانونی دووەم 2015' },
      { ref: '2015-02-03', short: '2015-02-03', long: '2015 شوبات 3, سێشەممە', month_standalone: 'شوبات 2015' },
      { ref: '2022-01-25', short: '2022-01-25', long: '2022 کانونی دووەم 25, سێشەممە', month_standalone: 'کانونی دووەم 2022' },
      { ref: '2020-02-29', short: '2020-02-29', long: '2020 شوبات 29, شەممە', month_standalone: 'شوبات 2020' },
      { ref: '2015-09-04', short: '2015-09-04', long: '2015 ئەيلوول 4, هەينى', month_standalone: 'ئەيلوول 2015' },
      { ref: '1979-11-07', short: '1979-11-07', long: '1979 تشرینی دووەم 7, چوارشەممە', month_standalone: 'تشرینی دووەم 1979' },
      { ref: '2020-03-02', short: '2020-03-02', long: '2020 ئازار 2, دووشەممە', month_standalone: 'ئازار 2020' },
      { ref: '2021-10-31', short: '2021-10-31', long: '2021 تشرینی یەکەم 31, یەکشەممە', month_standalone: 'تشرینی یەکەم 2021' },
      { ref: '2024-12-31', short: '2024-12-31', long: '2024 کانونی یەکەم 31, سێشەممە', month_standalone: 'کانونی یەکەم 2024' }
    ],
    times: [
      { ref: '01:05', short: '01:05', long: '01:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'ta',
    number_decimal_separator: '.',
    short_date_pattern: 'd/M/yyyy',
    long_date_pattern: 'dddd, d MMMM, yyyy',
    short_time_pattern: 'tt h:mm',
    long_time_pattern: 'tt h:mm:ss',
    am_designator: 'முற்பகல்',
    pm_designator: 'பிற்பகல்',
    month_names_raw: [
      'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
      'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'
    ],
    month_genitive_names_raw: [
      'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
      'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'
    ],
    dates: [
      { ref: '2015-01-01', short: '1/1/2015', long: 'வியாழன், 1 ஜனவரி, 2015', month_standalone: 'ஜனவரி 2015' },
      { ref: '2015-02-03', short: '3/2/2015', long: 'செவ்வாய், 3 பிப்ரவரி, 2015', month_standalone: 'பிப்ரவரி 2015' },
      { ref: '2022-01-25', short: '25/1/2022', long: 'செவ்வாய், 25 ஜனவரி, 2022', month_standalone: 'ஜனவரி 2022' },
      { ref: '2020-02-29', short: '29/2/2020', long: 'சனி, 29 பிப்ரவரி, 2020', month_standalone: 'பிப்ரவரி 2020' },
      { ref: '2015-09-04', short: '4/9/2015', long: 'வெள்ளி, 4 செப்டம்பர், 2015', month_standalone: 'செப்டம்பர் 2015' },
      { ref: '1979-11-07', short: '7/11/1979', long: 'புதன், 7 நவம்பர், 1979', month_standalone: 'நவம்பர் 1979' },
      { ref: '2020-03-02', short: '2/3/2020', long: 'திங்கள், 2 மார்ச், 2020', month_standalone: 'மார்ச் 2020' },
      { ref: '2021-10-31', short: '31/10/2021', long: 'ஞாயிறு, 31 அக்டோபர், 2021', month_standalone: 'அக்டோபர் 2021' },
      { ref: '2024-12-31', short: '31/12/2024', long: 'செவ்வாய், 31 டிசம்பர், 2024', month_standalone: 'டிசம்பர் 2024' }
    ],
    times: [
      { ref: '01:05', short: 'முற்பகல் 1:05', long: 'முற்பகல் 1:05:00' },
      { ref: '13:23', short: 'பிற்பகல் 1:23', long: 'பிற்பகல் 1:23:00' },
      { ref: '13:25', short: 'பிற்பகல் 1:25', long: 'பிற்பகல் 1:25:00' }
    ]
  },
  {
    locale: 'th',
    number_decimal_separator: '.',
    short_date_pattern: 'd/M/yyyy',
    long_date_pattern: 'ddddที่ d MMMM g yyyy',
    short_time_pattern: 'HH:mm',
    long_time_pattern: 'HH:mm:ss',
    am_designator: 'ก่อนเที่ยง',
    pm_designator: 'หลังเที่ยง',
    month_names_raw: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
    dates: [
      { ref: '2015-01-01', short: '1/1/2558', long: 'วันพฤหัสบดีที่ 1 มกราคม พ.ศ. 2558', month_standalone: 'มกราคม 2558' },
      { ref: '2015-02-03', short: '3/2/2558', long: 'วันอังคารที่ 3 กุมภาพันธ์ พ.ศ. 2558', month_standalone: 'กุมภาพันธ์ 2558' },
      { ref: '2022-01-25', short: '25/1/2565', long: 'วันอังคารที่ 25 มกราคม พ.ศ. 2565', month_standalone: 'มกราคม 2565' },
      { ref: '2020-02-29', short: '29/2/2563', long: 'วันเสาร์ที่ 29 กุมภาพันธ์ พ.ศ. 2563', month_standalone: 'กุมภาพันธ์ 2563' },
      { ref: '2015-09-04', short: '4/9/2558', long: 'วันศุกร์ที่ 4 กันยายน พ.ศ. 2558', month_standalone: 'กันยายน 2558' },
      { ref: '1979-11-07', short: '7/11/2522', long: 'วันพุธที่ 7 พฤศจิกายน พ.ศ. 2522', month_standalone: 'พฤศจิกายน 2522' },
      { ref: '2020-03-02', short: '2/3/2563', long: 'วันจันทร์ที่ 2 มีนาคม พ.ศ. 2563', month_standalone: 'มีนาคม 2563' },
      { ref: '2021-10-31', short: '31/10/2564', long: 'วันอาทิตย์ที่ 31 ตุลาคม พ.ศ. 2564', month_standalone: 'ตุลาคม 2564' },
      { ref: '2024-12-31', short: '31/12/2567', long: 'วันอังคารที่ 31 ธันวาคม พ.ศ. 2567', month_standalone: 'ธันวาคม 2567' }
    ],
    times: [
      { ref: '01:05', short: '01:05', long: '01:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'tr',
    number_decimal_separator: ',',
    short_date_pattern: 'd.MM.yyyy',
    long_date_pattern: 'd MMMM yyyy dddd',
    short_time_pattern: 'HH:mm',
    long_time_pattern: 'HH:mm:ss',
    am_designator: 'ÖÖ',
    pm_designator: 'ÖS',
    month_names_raw: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    dates: [
      { ref: '2015-01-01', short: '1.01.2015', long: '1 Ocak 2015 Perşembe', month_standalone: 'Ocak 2015' },
      { ref: '2015-02-03', short: '3.02.2015', long: '3 Şubat 2015 Salı', month_standalone: 'Şubat 2015' },
      { ref: '2022-01-25', short: '25.01.2022', long: '25 Ocak 2022 Salı', month_standalone: 'Ocak 2022' },
      { ref: '2020-02-29', short: '29.02.2020', long: '29 Şubat 2020 Cumartesi', month_standalone: 'Şubat 2020' },
      { ref: '2015-09-04', short: '4.09.2015', long: '4 Eylül 2015 Cuma', month_standalone: 'Eylül 2015' },
      { ref: '1979-11-07', short: '7.11.1979', long: '7 Kasım 1979 Çarşamba', month_standalone: 'Kasım 1979' },
      { ref: '2020-03-02', short: '2.03.2020', long: '2 Mart 2020 Pazartesi', month_standalone: 'Mart 2020' },
      { ref: '2021-10-31', short: '31.10.2021', long: '31 Ekim 2021 Pazar', month_standalone: 'Ekim 2021' },
      { ref: '2024-12-31', short: '31.12.2024', long: '31 Aralık 2024 Salı', month_standalone: 'Aralık 2024' }
    ],
    times: [
      { ref: '01:05', short: '01:05', long: '01:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'uk',
    number_decimal_separator: ',',
    short_date_pattern: 'dd.MM.yyyy',
    long_date_pattern: "dddd, d MMMM yyyy 'р'.",
    short_time_pattern: 'HH:mm',
    long_time_pattern: 'HH:mm:ss',
    am_designator: 'дп',
    pm_designator: 'пп',
    month_names_raw: ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'],
    month_genitive_names_raw: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
    dates: [
      { ref: '2015-01-01', short: '01.01.2015', long: 'четвер, 1 січня 2015 р.', month_standalone: 'січень 2015' },
      { ref: '2015-02-03', short: '03.02.2015', long: 'вівторок, 3 лютого 2015 р.', month_standalone: 'лютий 2015' },
      { ref: '2022-01-25', short: '25.01.2022', long: 'вівторок, 25 січня 2022 р.', month_standalone: 'січень 2022' },
      { ref: '2020-02-29', short: '29.02.2020', long: 'субота, 29 лютого 2020 р.', month_standalone: 'лютий 2020' },
      { ref: '2015-09-04', short: '04.09.2015', long: 'пʼятниця, 4 вересня 2015 р.', month_standalone: 'вересень 2015' },
      { ref: '1979-11-07', short: '07.11.1979', long: 'середа, 7 листопада 1979 р.', month_standalone: 'листопад 1979' },
      { ref: '2020-03-02', short: '02.03.2020', long: 'понеділок, 2 березня 2020 р.', month_standalone: 'березень 2020' },
      { ref: '2021-10-31', short: '31.10.2021', long: 'неділя, 31 жовтня 2021 р.', month_standalone: 'жовтень 2021' },
      { ref: '2024-12-31', short: '31.12.2024', long: 'вівторок, 31 грудня 2024 р.', month_standalone: 'грудень 2024' }
    ],
    times: [
      { ref: '01:05', short: '01:05', long: '01:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  },
  {
    locale: 'zu-ZA',
    number_decimal_separator: '.',
    short_date_pattern: 'M/d/yyyy',
    long_date_pattern: 'dddd, MMMM d, yyyy',
    short_time_pattern: 'HH:mm',
    long_time_pattern: 'HH:mm:ss',
    am_designator: 'AM',
    pm_designator: 'PM',
    month_names_raw: [
      'Januwari', 'Februwari', 'Mashi', 'Ephreli', 'Meyi', 'Juni',
      'Julayi', 'Agasti', 'Septhemba', 'Okthoba', 'Novemba', 'Disemba'
    ],
    dates: [
      { ref: '2015-01-01', short: '1/1/2015', long: 'ULwesine, Januwari 1, 2015', month_standalone: 'Januwari 2015' },
      { ref: '2015-02-03', short: '2/3/2015', long: 'ULwesibili, Februwari 3, 2015', month_standalone: 'Februwari 2015' },
      { ref: '2022-01-25', short: '1/25/2022', long: 'ULwesibili, Januwari 25, 2022', month_standalone: 'Januwari 2022' },
      { ref: '2020-02-29', short: '2/29/2020', long: 'UMgqibelo, Februwari 29, 2020', month_standalone: 'Februwari 2020' },
      { ref: '2015-09-04', short: '9/4/2015', long: 'ULwesihlanu, Septhemba 4, 2015', month_standalone: 'Septhemba 2015' },
      { ref: '1979-11-07', short: '11/7/1979', long: 'ULwesithathu, Novemba 7, 1979', month_standalone: 'Novemba 1979' },
      { ref: '2020-03-02', short: '3/2/2020', long: 'UMsombuluko, Mashi 2, 2020', month_standalone: 'Mashi 2020' },
      { ref: '2021-10-31', short: '10/31/2021', long: 'ISonto, Okthoba 31, 2021', month_standalone: 'Okthoba 2021' },
      { ref: '2024-12-31', short: '12/31/2024', long: 'ULwesibili, Disemba 31, 2024', month_standalone: 'Disemba 2024' }
    ],
    times: [
      { ref: '01:05', short: '01:05', long: '01:05:00' },
      { ref: '13:23', short: '13:23', long: '13:23:00' },
      { ref: '13:25', short: '13:25', long: '13:25:00' }
    ]
  }
];

export const ATLAS_DOCFX_CONFIG: DocFxConfiguration = {
  tableOfContentsMode: 'Grouped',
  classDocItem: {
    Sections: [
      'Title', 'summary', 'Definition', 'ConstructorOverloads', 'MethodOverloads',
      'TypeParameters', 'Parameters', 'EnumFields', 'Inheritance', 'Derived',
      'Implement', 'EventType', 'FieldValue', 'Value', 'Returns', 'Exception',
      'Example', 'Remarks', 'SeeAlso', 'Namespaces', 'TableOfContents', 'Classes',
      'Structs', 'Interfaces', 'Enums', 'Delegates', 'Constructors', 'Fields',
      'Properties', 'Methods', 'Events', 'Operators', 'ExplicitInterfaceImplementations'
    ]
  },
  structDocItem: {
    Sections: [
      'Title', 'summary', 'Definition', 'ConstructorOverloads', 'MethodOverloads',
      'TypeParameters', 'Parameters', 'EnumFields', 'Inheritance', 'Derived',
      'Implement', 'EventType', 'FieldValue', 'Value', 'Returns', 'Exception',
      'Example', 'Remarks', 'SeeAlso', 'Namespaces', 'TableOfContents', 'Classes',
      'Structs', 'Interfaces', 'Enums', 'Delegates', 'Constructors', 'Fields',
      'Properties', 'Methods', 'Events', 'Operators', 'ExplicitInterfaceImplementations'
    ]
  },
  interfaceDocItem: {
    Sections: [
      'Title', 'summary', 'Definition', 'ConstructorOverloads', 'MethodOverloads',
      'TypeParameters', 'Parameters', 'EnumFields', 'Inheritance', 'Derived',
      'Implement', 'EventType', 'FieldValue', 'Value', 'Returns', 'Exception',
      'Example', 'Remarks', 'SeeAlso', 'Namespaces', 'TableOfContents', 'Classes',
      'Structs', 'Interfaces', 'Enums', 'Delegates', 'Constructors', 'Fields',
      'Properties', 'Methods', 'Events', 'Operators', 'ExplicitInterfaceImplementations'
    ]
  },
  enumDocItem: {
    Sections: [
      'Title', 'summary', 'Definition', 'ConstructorOverloads', 'MethodOverloads',
      'TypeParameters', 'Parameters', 'TableOfContents', 'EnumFields', 'Inheritance',
      'Derived', 'Implement', 'EventType', 'FieldValue', 'Value', 'Returns', 'Exception',
      'Example', 'Remarks', 'SeeAlso', 'Namespaces', 'Classes', 'Structs', 'Interfaces',
      'Enums', 'Delegates', 'Constructors', 'Fields', 'Properties', 'Methods', 'Events',
      'Operators', 'ExplicitInterfaceImplementations'
    ]
  }
};

export const ATLAS_DIATAXIS_SAMPLE_AUDIT: DiataxisPageValidation[] = [
  {
    pagePath: 'scenarios/kitchen-temperature-monitoring.mdx',
    title: 'Monitorización de Temperaturas Críticas en Cocina',
    role: 'how-to',
    persona: 'Chef Ejecutivo / Auditor de Calidad',
    isValid: true,
    checks: [
      { id: 'c-1', category: 'diataxis_role', description: 'Rol Diátaxis Válido (how-to)', status: 'passed', details: 'Orientado a resolución práctica de tareas paso a paso.' },
      { id: 'c-2', category: 'example_validity', description: 'Código y Ejemplos Conectados', status: 'passed', details: 'Usa fuentes verificadas y parámetros validados.' },
      { id: 'c-3', category: 'scenario_contract', description: 'Contrato de API de Escenario', status: 'passed', details: 'Mapeo 1:1 con scenario-api-contract.json' },
      { id: 'c-4', category: 'prohibited_terms', description: 'Prevención de Términos Prohibidos', status: 'passed', details: 'Sin clichés ni marcas no autorizadas.' }
    ]
  },
  {
    pagePath: 'start/quickstart-director-console.mdx',
    title: 'Inicio Rápido: Consola del Director Atlas',
    role: 'tutorial',
    persona: 'Director de Operaciones',
    isValid: true,
    checks: [
      { id: 'c-5', category: 'diataxis_role', description: 'Estructura Tutorial con Resultado', status: 'passed', details: 'Incluye sección de Resultado determinista.' },
      { id: 'c-6', category: 'metadata', description: 'Front Matter Completo', status: 'passed', details: 'Título, persona, rol Diátaxis declarados correctamente.' },
      { id: 'c-7', category: 'related_links', description: 'Enlaces Relacionados', status: 'passed', details: 'Al menos dos enlaces con referencia a la API de la misma versión.' }
    ]
  },
  {
    pagePath: 'concepts/rbac-multi-branch-architecture.mdx',
    title: 'Arquitectura de Seguridad RBAC y Firestore Rules',
    role: 'explanation',
    persona: 'Arquitecto de Software & Seguridad',
    isValid: true,
    checks: [
      { id: 'c-8', category: 'diataxis_role', description: 'Enfoque Teórico y de Dominio', status: 'passed', details: 'Explica los principios del control de acceso multi-sucursal.' },
      { id: 'c-9', category: 'related_links', description: 'Conexión a Guías Prácticas', status: 'passed', details: 'Referencias directas a implementación y reglas.' }
    ]
  }
];

export const ATLAS_OVERRIDE_SET = ['bn', 'fa', 'he', 'ku', 'ta', 'zu-ZA'];

export function searchAtlasLocales(term: string): LocaleCultureEntry[] {
  if (!term.trim()) return ATLAS_LOCALE_DATABASE;
  const q = term.toLowerCase();
  return ATLAS_LOCALE_DATABASE.filter(l => 
    l.locale.toLowerCase().includes(q) ||
    l.short_date_pattern.toLowerCase().includes(q) ||
    l.dates.some(d => d.month_standalone.toLowerCase().includes(q) || d.long.toLowerCase().includes(q))
  );
}
