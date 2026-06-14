-- Shared-infrastructure suppression: platforms scammers ABUSE but that are not
-- themselves scams. An entity on one of these can never publish a verdict page
-- (the scam is a tenant, not the platform). Abuse goes to the platform, not a
-- public accusation against it. This is the infra-layer cash@square fix.
CREATE TABLE IF NOT EXISTS shared_infra (
  suffix TEXT PRIMARY KEY,   -- registrable platform domain; matches itself + any subdomain
  kind   TEXT                -- 'hosting' | 'shortener' | 'cdn' | 'gateway'
);
INSERT OR IGNORE INTO shared_infra (suffix, kind) VALUES
 ('vercel.app','hosting'),('web.app','hosting'),('pages.dev','hosting'),('github.io','hosting'),
 ('firebaseapp.com','hosting'),('blogspot.com','hosting'),('wordpress.com','hosting'),('weebly.com','hosting'),
 ('wixsite.com','hosting'),('glitch.me','hosting'),('repl.co','hosting'),('netlify.app','hosting'),
 ('herokuapp.com','hosting'),('azurewebsites.net','hosting'),('azurefd.net','cdn'),('cloudfront.net','cdn'),
 ('r2.dev','cdn'),('workers.dev','hosting'),('ipfs.io','gateway'),('dweb.link','gateway'),('wasmer.app','hosting'),
 ('onrender.com','hosting'),('surge.sh','hosting'),('000webhostapp.com','hosting'),('free.nf','hosting'),
 ('iceiy.com','hosting'),('rf.gd','hosting'),('infinityfreeapp.com','hosting'),('webflow.io','hosting'),
 ('notion.site','hosting'),('sites.google.com','hosting'),('translate.goog','cdn'),('duckdns.org','hosting'),
 ('ngrok.io','hosting'),('amazonaws.com','cdn'),('googleusercontent.com','cdn'),
 ('tiny.cc','shortener'),('bit.ly','shortener'),('cutt.ly','shortener'),('t.co','shortener'),
 ('goo.gl','shortener'),('rebrand.ly','shortener'),('t.me','shortener'),('telegram.me','shortener');

-- Rebuild the publish gate with shared-infra suppression added.
DROP VIEW IF EXISTS publishable_entities;
CREATE VIEW publishable_entities AS
SELECT e.*
FROM entities e
WHERE e.status NOT IN ('delisted','allowlisted')
  AND e.corroborations >= 2
  AND e.max_score >= 70
  AND NOT EXISTS (SELECT 1 FROM allowlist a WHERE a.pattern = e.entity_value)
  AND NOT EXISTS (SELECT 1 FROM shared_infra s
                  WHERE e.entity_value = s.suffix OR e.entity_value LIKE '%.' || s.suffix)
  AND EXISTS (SELECT 1 FROM detections d WHERE d.entity_id = e.id AND d.env = 'prod');
