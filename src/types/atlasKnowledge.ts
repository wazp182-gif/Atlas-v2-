export interface LocaleDateSample {
  ref: string;
  short: string;
  long: string;
  month_standalone: string;
}

export interface LocaleTimeSample {
  ref: string;
  short: string;
  long: string;
}

export interface LocaleCultureEntry {
  locale: string;
  number_decimal_separator: string;
  short_date_pattern: string;
  long_date_pattern: string;
  short_time_pattern: string;
  long_time_pattern: string;
  am_designator: string;
  pm_designator: string;
  month_names_raw?: string[];
  month_genitive_names_raw?: string[];
  dates: LocaleDateSample[];
  times: LocaleTimeSample[];
}

export interface PlatformProbeSnapshot {
  environment: {
    dotnet_version: string;
    framework: string;
    os: string;
    rid?: string;
    globalization?: string;
    timestamp: string;
  };
  locales: LocaleCultureEntry[];
}

export interface DocItemSchema {
  Sections: string[];
}

export interface DocFxConfiguration {
  tableOfContentsMode: string;
  classDocItem: DocItemSchema;
  structDocItem: DocItemSchema;
  interfaceDocItem: DocItemSchema;
  enumDocItem: DocItemSchema;
}

export interface DiataxisRuleCheck {
  id: string;
  category: 'diataxis_role' | 'example_validity' | 'related_links' | 'scenario_contract' | 'prohibited_terms' | 'metadata';
  description: string;
  status: 'passed' | 'warning' | 'failed';
  details: string;
}

export interface DiataxisPageValidation {
  pagePath: string;
  title: string;
  role: 'tutorial' | 'how-to' | 'explanation' | 'reference';
  persona: string;
  checks: DiataxisRuleCheck[];
  isValid: boolean;
}
