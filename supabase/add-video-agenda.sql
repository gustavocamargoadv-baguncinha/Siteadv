-- Libera o tipo de compromisso "video" (reunião por vídeo / Teams) na agenda.
-- Rode isto UMA VEZ no SQL Editor do Supabase se você criou o banco antes
-- desta atualização. É seguro e não apaga nada.
--
-- Remove a restrição antiga (que só aceitava os 5 tipos originais) e recria
-- já incluindo 'video'. Como o próprio sistema controla os tipos válidos,
-- isso apenas acompanha a lista da aplicação.

alter table eventos_agenda drop constraint if exists eventos_agenda_tipo_check;

alter table eventos_agenda
  add constraint eventos_agenda_tipo_check
  check (tipo in ('audiencia', 'reuniao', 'sustentacao', 'atendimento', 'video', 'outro'));
