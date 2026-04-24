// stateTaxData.ts — US State Sales Tax Rates (2026)
// Source: Tax Foundation 2026 State & Local Sales Tax Rates
// Rates represent the average combined state + local rate for each state.
// States with no sales tax use 0.

export interface StateTaxEntry {
  code: string;   // 2-letter abbreviation
  name: string;
  rate: number;   // decimal, e.g. 0.0725 for 7.25%
}

export const STATE_TAX_RATES: StateTaxEntry[] = [
  { code: "AL", name: "Alabama",        rate: 0.0922 },
  { code: "AK", name: "Alaska",         rate: 0.0176 }, // no state tax, local only
  { code: "AZ", name: "Arizona",        rate: 0.0840 },
  { code: "AR", name: "Arkansas",       rate: 0.0947 },
  { code: "CA", name: "California",     rate: 0.0868 },
  { code: "CO", name: "Colorado",       rate: 0.0773 },
  { code: "CT", name: "Connecticut",    rate: 0.0635 },
  { code: "DE", name: "Delaware",       rate: 0.0000 },
  { code: "FL", name: "Florida",        rate: 0.0708 },
  { code: "GA", name: "Georgia",        rate: 0.0732 },
  { code: "HI", name: "Hawaii",         rate: 0.0444 },
  { code: "ID", name: "Idaho",          rate: 0.0603 },
  { code: "IL", name: "Illinois",       rate: 0.0882 },
  { code: "IN", name: "Indiana",        rate: 0.0700 },
  { code: "IA", name: "Iowa",           rate: 0.0694 },
  { code: "KS", name: "Kansas",         rate: 0.0868 },
  { code: "KY", name: "Kentucky",       rate: 0.0600 },
  { code: "LA", name: "Louisiana",      rate: 0.0952 },
  { code: "ME", name: "Maine",          rate: 0.0550 },
  { code: "MD", name: "Maryland",       rate: 0.0600 },
  { code: "MA", name: "Massachusetts",  rate: 0.0625 },
  { code: "MI", name: "Michigan",       rate: 0.0600 },
  { code: "MN", name: "Minnesota",      rate: 0.0749 },
  { code: "MS", name: "Mississippi",    rate: 0.0707 },
  { code: "MO", name: "Missouri",       rate: 0.0825 },
  { code: "MT", name: "Montana",        rate: 0.0000 },
  { code: "NE", name: "Nebraska",       rate: 0.0694 },
  { code: "NV", name: "Nevada",         rate: 0.0823 },
  { code: "NH", name: "New Hampshire",  rate: 0.0000 },
  { code: "NJ", name: "New Jersey",     rate: 0.0660 },
  { code: "NM", name: "New Mexico",     rate: 0.0783 },
  { code: "NY", name: "New York",       rate: 0.0852 },
  { code: "NC", name: "North Carolina", rate: 0.0698 },
  { code: "ND", name: "North Dakota",   rate: 0.0696 },
  { code: "OH", name: "Ohio",           rate: 0.0722 },
  { code: "OK", name: "Oklahoma",       rate: 0.0898 },
  { code: "OR", name: "Oregon",         rate: 0.0000 },
  { code: "PA", name: "Pennsylvania",   rate: 0.0634 },
  { code: "RI", name: "Rhode Island",   rate: 0.0700 },
  { code: "SC", name: "South Carolina", rate: 0.0746 },
  { code: "SD", name: "South Dakota",   rate: 0.0640 },
  { code: "TN", name: "Tennessee",      rate: 0.0955 },
  { code: "TX", name: "Texas",          rate: 0.0819 },
  { code: "UT", name: "Utah",           rate: 0.0719 },
  { code: "VT", name: "Vermont",        rate: 0.0624 },
  { code: "VA", name: "Virginia",       rate: 0.0575 },
  { code: "WA", name: "Washington",     rate: 0.0921 },
  { code: "WV", name: "West Virginia",  rate: 0.0650 },
  { code: "WI", name: "Wisconsin",      rate: 0.0543 },
  { code: "WY", name: "Wyoming",        rate: 0.0536 },
  { code: "DC", name: "Washington D.C.", rate: 0.0600 },
];

// Default to no tax selected
export const NO_TAX_STATE = { code: "", name: "Select state…", rate: 0 };

export function getStateTaxByCode(code: string): StateTaxEntry | undefined {
  return STATE_TAX_RATES.find(s => s.code === code);
}
