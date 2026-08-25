package my.khairat.masjidtengah;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String HOME = "https://khairat-masjid-tengah.vercel.app/login";
    private static final String HOST = "khairat-masjid-tengah.vercel.app";
    private WebView webView;
    private ProgressBar progress;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        root.addView(progress, new LinearLayout.LayoutParams(-1, 6));
        webView = new WebView(this);
        root.addView(webView, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(root);

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        webView.getSettings().setUserAgentString(webView.getSettings().getUserAgentString() + " KhairatMasjidTengahAndroid/1.0");
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int value) {
                progress.setProgress(value);
                progress.setVisibility(value == 100 ? View.GONE : View.VISIBLE);
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) return false;
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, android.webkit.WebResourceError error) {
                if (request.isForMainFrame()) view.loadData("<html><body style='font-family:sans-serif;text-align:center;padding:48px;color:#173b2e'><h2>Tiada sambungan</h2><p>Semak internet anda dan cuba semula.</p><button onclick='location.href=\""+HOME+"\"' style='padding:12px 18px;background:#0b4938;color:white;border:0;border-radius:8px'>Cuba semula</button></body></html>", "text/html", "UTF-8");
            }
        });
        webView.setDownloadListener((url, agent, disposition, type, length) -> startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))));
        if (state == null) webView.loadUrl(HOME); else webView.restoreState(state);
    }

    @Override public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }
    @Override protected void onSaveInstanceState(Bundle out) {
        webView.saveState(out);
        super.onSaveInstanceState(out);
    }
}
