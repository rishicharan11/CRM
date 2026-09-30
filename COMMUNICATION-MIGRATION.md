# Phase 4: Communication UI migration

## Scope and reference

This phase covers the Communication scope in `CUSTOMER-MODULE-SCOPE.md` and `COMPONENT-MAPPING.md`: the All inbox route (`#inbox`), the Communication tab on customer detail routes (`#customer-CUST-…`), and the Communication tab on query detail routes (`#query-QRY-…`). The existing Customer code remains the source of truth for message data, filters, routes, keyboard behavior and send flows. The visual reference is the local checkout of `yakosasam797/pakages-module`, primarily `vendor-crm/src/components/CommunicationPanel.css` and its mail workspace.

## Screens and states migrated

| Surface | Existing states covered |
| --- | --- |
| All inbox | Conversation list, unread count, selected/read/unread rows, search and no match, All/Read/Unread/With attachments tabs, initial thread empty state, Email history, reply/new composer, attachment label, template menu, mark unread, new conversation customer picker, picker no match, sent confirmation. |
| WhatsApp renderer | Existing incoming/outgoing bubbles, timestamp, upload, message field, disabled send and channel badge styling. See limitation below. |
| Customer Communication | All mail/Inbox/Sent folder rail, collapsed rail, mail rows, empty mailbox, reader, attachments, composer, templates, disabled send, attachment removal and send. |
| Query Communication | The same customer mail visual recipe, with query context and its own folder, reader and composer interactions. |
| Responsive | Existing stacked inbox and mail layouts at narrow widths, with an icon sized add action and wrapped query mail header. |

## Components reused and adapted

- Reused the established design tokens, fonts, icon symbols, buttons, search fields, tabs, modal shell, status treatment and focus rules. No new shared component or token was added.
- Adapted the existing `.inbox-*` classes to the Vendor CRM mail row, reader, composer, surface and empty state patterns. The Customer inbox keeps its split navigation and channel specific message rendering.
- Adapted the existing `.customer-mail-*` classes once for both customer and query Communication. The existing markup and event handlers continue to power both views.
- Kept Communication specific WhatsApp bubbles, channel indicators, email cards, attachments, customer picker and templates isolated under their existing classes. The reference has no exported WhatsApp thread or inbox split component.

## Visual changes

- Mail and conversation rows use the reference's white surfaces, subtle dividers, 88px hierarchy, Onest emphasis, Public Sans secondary text, mono timestamps and token based hover and active treatments.
- The folder rail uses the reference's white surface and pink active state. Email and unread indicators retain their semantic channel and attention tokens.
- Email history, reader text, composer lines, attachment chips, empty states, recipient choices and sent confirmation use shared borders, radius, spacing, typography and focus colors.
- Mobile add conversation remains an icon control, and the query mail header wraps to keep its customer context readable.

## UX and functionality preserved

No JavaScript, HTML, routes, APIs, seed data, persistence, business logic or message behavior changed. Search still matches names and previews; the four inbox filters and three mail folders retain their existing options. Conversation selection, mark unread, compose, templates, attachments, send, discard, collapse, modal actions and cross context customer mail relationships remain unchanged.

## Validation

- Ran the local Vite application and a production Vite build successfully.
- Checked `#inbox`, `#customer-CUST-0001` Communication and `#query-QRY-2001` Communication in Chrome at desktop, tablet and 390px mobile widths. Reviewed screenshots of the inbox, thread, composer, picker, sent dialog, customer mail and query mail.
- Browser interaction checks passed for search/no match, every inbox tab, selection, unread action, reply, templates, disabled/enabled send, sent confirmation, new conversation, customer and query mail folders, sidebar collapse, readers, attachments, removal and discard. No browser console or page errors occurred.
- Confirmed only CSS and this document changed in this phase. The production build includes no TypeScript step because this application is plain JavaScript.

## Deviations and known issues

- The reference does not export an inbox split view, WhatsApp thread or Customer query mail component; these keep the Customer structures with the closest Vendor mail visual rules.
- `renderWhatsAppConversation()` exists, but the current inbox data, create flow and thread dispatcher are email only. There is no reachable WhatsApp route or channel choice to exercise in the current application. This phase styles the existing renderer without changing channel behavior.
- The current Communication implementation has no dedicated asynchronous loading or network error view. Existing empty, disabled and form validation states were styled and tested; no artificial loading or error workflow was added.
- The existing inbox attachment control shows the selected file name, while its email send handler does not add that file to the sent message. That preexisting behavior was left intact because this phase is visual only.
