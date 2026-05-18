package com.myhabits.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/**
 * Reads the same state shape that store.jsx writes to localStorage.
 * Stored as JSON under a single SharedPreferences key so widgets can render
 * without having to parse anything else.
 */
class HabitStore(private val ctx: Context) {

    private val prefs by lazy {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    }

    fun writeRaw(json: String) {
        prefs.edit().putString(KEY_STATE, json).apply()
    }

    fun readRaw(): String? = prefs.getString(KEY_STATE, null)

    fun readState(): State? {
        val raw = readRaw() ?: return null
        return try {
            parse(JSONObject(raw))
        } catch (_: Throwable) {
            null
        }
    }

    private fun parse(root: JSONObject): State {
        val habitsArr = root.optJSONArray("habits") ?: JSONArray()
        val habits = ArrayList<Habit>(habitsArr.length())
        for (i in 0 until habitsArr.length()) {
            val h = habitsArr.optJSONObject(i) ?: continue
            val entriesObj = h.optJSONObject("entries") ?: JSONObject()
            val entries = HashMap<String, Int>(entriesObj.length())
            val it = entriesObj.keys()
            while (it.hasNext()) {
                val k = it.next()
                entries[k] = entriesObj.optInt(k, 0)
            }
            val scheduleArr = h.optJSONArray("schedule") ?: JSONArray()
            val schedule = HashSet<Int>(scheduleArr.length())
            for (j in 0 until scheduleArr.length()) schedule.add(scheduleArr.optInt(j))
            habits += Habit(
                id = h.optString("id"),
                name = h.optString("name"),
                icon = h.optString("icon"),
                color = h.optString("color", "#f97316"),
                target = h.optInt("target", 1).coerceAtLeast(1),
                schedule = if (schedule.isEmpty()) setOf(0,1,2,3,4,5,6) else schedule,
                entries = entries,
            )
        }
        val settings = root.optJSONObject("settings")
        return State(habits = habits, accent = settings?.optString("accent", "#f97316") ?: "#f97316")
    }

    data class State(val habits: List<Habit>, val accent: String)
    data class Habit(
        val id: String,
        val name: String,
        val icon: String,
        val color: String,
        val target: Int,
        val schedule: Set<Int>,
        val entries: Map<String, Int>,
    ) {
        /** Mon=0..Sun=6 to match the web app. */
        private fun weekdayIndex(cal: Calendar): Int {
            // Calendar.SUNDAY=1..SATURDAY=7 → Mon=0..Sun=6
            return (cal.get(Calendar.DAY_OF_WEEK) + 5) % 7
        }

        fun dateKeyOf(cal: Calendar): String {
            val y = cal.get(Calendar.YEAR)
            val m = (cal.get(Calendar.MONTH) + 1).toString().padStart(2, '0')
            val d = cal.get(Calendar.DAY_OF_MONTH).toString().padStart(2, '0')
            return "$y-$m-$d"
        }

        fun todayProgress(): Int = entries[dateKeyOf(Calendar.getInstance())] ?: 0

        fun todayDone(): Boolean = todayProgress() >= target

        /** Streak math mirrors computeStreak in lib.js. */
        fun streak(): Int {
            val cal = Calendar.getInstance()
            if (!todayDone()) cal.add(Calendar.DAY_OF_MONTH, -1)
            var s = 0
            repeat(3650) {
                val scheduled = schedule.contains(weekdayIndex(cal))
                if (scheduled) {
                    val v = entries[dateKeyOf(cal)] ?: 0
                    if (v >= target) s++ else return s
                }
                cal.add(Calendar.DAY_OF_MONTH, -1)
            }
            return s
        }
    }

    companion object {
        private const val PREFS = "myhabits"
        private const val KEY_STATE = "state_v1"
    }
}
