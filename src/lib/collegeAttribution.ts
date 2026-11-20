export function collegeAttribution(params: URLSearchParams) {
  const attribution: Record<string, string> = {};
  const allowedAttribution: Record<string, RegExp> = {
    utm_source: /^email$/,
    utm_medium: /^outreach$/,
    utm_campaign: /^comunidades_profesionales(?:_qa)?$/,
    utm_content: /^(?:qa_)?(?:(?:cuotas|credencial|autonomia|descubrimiento)_)?photo_[abc]$/,
  };
  for (const [key, allowed] of Object.entries(allowedAttribution)) {
    const value = params.get(key);
    if (value && allowed.test(value)) attribution[key] = value;
  }
  return attribution;
}
