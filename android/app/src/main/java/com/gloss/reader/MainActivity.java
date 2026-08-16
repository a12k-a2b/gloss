package com.gloss.reader;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onStart() {
    super.onStart();
    if (getBridge() == null) return;
    WebView web = getBridge().getWebView();
    if (web == null) return;
    web.setOnLongClickListener(v -> true);
    web.setLongClickable(false);
    web.setHapticFeedbackEnabled(false);
  }
}
