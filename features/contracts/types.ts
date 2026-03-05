export type ContractStatus = 'pending' | 'signed' | 'voided';

export interface Contract {
  id: string;
  tenantId: string;
  residentId?: string;
  residentName: string;
  residentEmail: string;
  templateId: string;
  templateTitle: string;
  status: ContractStatus;
  signedAt?: string;
  signatureDataUrl?: string; // base64 PNG stored temporarily during signing
  pdfUrl?: string;           // Firebase Storage download URL after signing
  sentAt: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface ContractTemplate {
  id: string;
  title: string;
  body: string; // HTML or plain text
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Built-in default template used when no custom template exists
export const DEFAULT_TEMPLATE_BODY = `
<h2>Resident Intake Agreement</h2>

<p>This Resident Intake Agreement ("Agreement") is entered into between the Recovery House Operator ("House") and the individual signing below ("Resident").</p>

<h3>1. House Rules</h3>
<p>Resident agrees to abide by all posted house rules, including but not limited to: no use of alcohol or illicit substances on or off premises, compliance with curfew, participation in required meetings and chores, and maintaining a clean and respectful living environment.</p>

<h3>2. Zero Tolerance Policy</h3>
<p>Any use of drugs or alcohol will result in immediate discharge. The House reserves the right to require drug testing at any time.</p>

<h3>3. Financial Obligations</h3>
<p>Resident agrees to pay weekly program fees on time. Non-payment may result in discharge. Fees are non-refundable once the week has begun.</p>

<h3>4. Liability Waiver</h3>
<p>Resident acknowledges that the House is not a licensed treatment facility. The House is not liable for any personal injury, illness, theft, or loss of personal property. Resident assumes all risk associated with sober living participation.</p>

<h3>5. Consent to Treatment Information</h3>
<p>Resident consents to sharing basic status information (enrollment status, phase level) with authorized referral partners and treatment providers involved in Resident's care plan, to the extent permitted by applicable law.</p>

<h3>6. Confidentiality</h3>
<p>Resident agrees to maintain the confidentiality of other residents and not to disclose information about other residents outside the house community.</p>

<h3>7. Search Policy</h3>
<p>Resident consents to reasonable searches of personal belongings and living space when house staff have reasonable cause to believe a rule violation has occurred.</p>

<h3>8. Discharge Policy</h3>
<p>Resident may be discharged for violation of house rules, non-payment, or behavior deemed disruptive to the recovery community. Upon discharge, Resident must vacate the premises within the timeframe specified by staff.</p>

<h3>9. Agreement</h3>
<p>By signing below, Resident acknowledges that they have read, understand, and agree to all terms of this Agreement. Resident enters into this Agreement voluntarily and of their own free will.</p>
`.trim();

export const DEFAULT_TEMPLATE: ContractTemplate = {
  id: 'default',
  title: 'Resident Intake Agreement',
  body: DEFAULT_TEMPLATE_BODY,
  tenantId: 'system',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
