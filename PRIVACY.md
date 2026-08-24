# SkillQuest AI privacy

SkillQuest AI stores the learning goals, generated quest plans, mission proof,
reflections, Mentor conversation, preferences, and progress that a user enters
or creates. Inside Anna, this data is saved through Anna Storage for the current
user and app. In standalone preview mode, the same data is stored only in the
current browser's local storage.

The app sends the minimum active-adventure context needed for quest generation,
mission evaluation, or Mentor replies to the Anna LLM Host API. It does not use
a separate model-provider key, sell personal data, embed advertising trackers,
or send data to an independent SkillQuest server.

Users can export a JSON backup or permanently clear all SkillQuest data from
Settings. Exported files remain under the user's control. Avoid placing secrets,
credentials, or highly sensitive personal information in mission proof.
