package com.gloss.reader;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
  @Override
  public void onStart() {
    super.onStart();
    hardenWebView();
    deliverPendingShare(getIntent());
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    deliverPendingShare(intent);
  }

  private void hardenWebView() {
    if (getBridge() == null) return;
    WebView web = getBridge().getWebView();
    if (web == null) return;
    web.setOnLongClickListener(v -> true);
    web.setLongClickable(false);
    web.setHapticFeedbackEnabled(false);
  }

  private void deliverPendingShare(Intent intent) {
    SharedPreferences prefs = getSharedPreferences("gloss", MODE_PRIVATE);
    String href = prefs.getString("pending_share", null);
    if (intent != null) {
      String extra = intent.getStringExtra("share_url");
      if (extra != null && extra.length() > 8) href = extra;
    }
    if (href == null || getBridge() == null || getBridge().getWebView() == null) return;
    prefs.edit().remove("pending_share").apply();
    try {
      String payload = JSONObject.quote(href);
      getBridge()
        .getWebView()
        .evaluateJavascript(
          "window.dispatchEvent(new CustomEvent('gloss-share',{detail:" + payload + "}))",
          null
        );
    } catch (Exception ignored) {
      /* next launch will retry if we put it back; we already cleared */
    }
  }
}
