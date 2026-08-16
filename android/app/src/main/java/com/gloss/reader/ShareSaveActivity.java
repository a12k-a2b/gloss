package com.gloss.reader;

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.widget.Toast;
import androidx.core.app.NotificationCompat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ShareSaveActivity extends Activity {
  private static final Pattern URL = Pattern.compile("https?://[^\\s<>\"']+", Pattern.CASE_INSENSITIVE);

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    String href = extractUrl(getIntent());
    if (href == null) {
      Toast.makeText(this, "Gloss could not find a link in that share.", Toast.LENGTH_SHORT).show();
      finish();
      return;
    }

    SharedPreferences prefs = getSharedPreferences("gloss", MODE_PRIVATE);
    prefs.edit().putString("pending_share", href).apply();

    Toast.makeText(this, "Saved to Gloss. Open the app when you want to read.", Toast.LENGTH_LONG).show();
    notifySaved(href);
    finish();
  }

  private String extractUrl(Intent intent) {
    if (intent == null) return null;
    String text = intent.getStringExtra(Intent.EXTRA_TEXT);
    if (text == null) text = intent.getStringExtra(Intent.EXTRA_SUBJECT);
    if (text == null) return null;
    Matcher m = URL.matcher(text);
    if (m.find()) return m.group();
    String t = text.trim();
    if (t.startsWith("www.")) return "https://" + t;
    return null;
  }

  private void notifySaved(String href) {
    try {
      NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
      if (nm == null) return;
      if (Build.VERSION.SDK_INT >= 26) {
        nm.createNotificationChannel(
          new NotificationChannel("gloss-share", "Saved pages", NotificationManager.IMPORTANCE_DEFAULT)
        );
      }
      Intent open = new Intent(this, MainActivity.class);
      open.setAction(Intent.ACTION_VIEW);
      open.putExtra("share_url", href);
      open.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
      PendingIntent pi = PendingIntent.getActivity(
        this,
        7,
        open,
        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
      );
      nm.notify(
        7,
        new NotificationCompat.Builder(this, "gloss-share")
          .setSmallIcon(R.mipmap.ic_launcher)
          .setContentTitle("In Gloss")
          .setContentText("Tap to read it, or stay where you are.")
          .setContentIntent(pi)
          .setAutoCancel(true)
          .build()
      );
    } catch (Exception ignored) {
      /* toast already shown */
    }
  }
}
