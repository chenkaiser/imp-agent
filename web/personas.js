export const PERSONAS = Object.freeze({
  sales: { label: 'Sales Representative', focus: 'Focus on customer needs, inventory availability, and sales orders.', description: 'Prepare for customer conversations with item availability and order details.', suggestions: [['Inventory', 'Check inventory availability'], ['Sales orders', 'Help me look up a sales order'], ['Customer needs', 'Help me check which items are available for a customer']] },
  service: { label: 'Customer Service Representative', focus: 'Focus on customer questions, order details, and clear follow-up steps.', description: 'Find order information and help customers get clear, useful answers.', suggestions: [['Order lookup', 'Help me look up a sales order'], ['Availability', 'Help me check availability for an item'], ['Follow-up', 'What information do you need to help with a customer order?']] },
  executive: { label: 'Executive', focus: 'Focus on concise business summaries, operational trends, and decision-relevant details.', description: 'Get a concise view of operations and the details behind business decisions.', suggestions: [['Operations', 'What operational information can you help me review?'], ['Production', 'Help me review a production order'], ['Inventory', 'Help me understand inventory availability']] },
  it: { label: 'IT Admin', focus: 'Focus on troubleshooting, configuration guidance, and clear technical explanations.', description: 'Troubleshoot workflows and find configuration and technical guidance.', suggestions: [['Configuration', 'How do I set up an email template?'], ['Troubleshooting', 'Help me troubleshoot an IMP workflow'], ['Acumatica', 'Help me find Acumatica configuration guidance']] },
});

export function getPersona(id) { return Object.hasOwn(PERSONAS, id) ? PERSONAS[id] : null; }
export function personaQuestion(id, question) {
  const persona = getPersona(id);
  if (!persona) throw new Error('Select a persona before sending a question.');
  return `My working persona is ${persona.label}. ${persona.focus}\n\n${question}`;
}
