'use strict';"use strict";
/**
 * A wrapper around a native element inside of a View.
 *
 * An `ElementRef` is backed by a render-specific element. In the browser, this is usually a DOM
 * element.
 */
// Note: We don't expose things like `Injector`, `ViewContainer`, ... here,
// i.e. users have to ask for what they need. With that, we can build better analysis tools
// and could do better codegen in the future.
var ElementRef = (function () {
    function ElementRef(nativeElement) {
        this.nativeElement = nativeElement;
    }
    return ElementRef;
}());
exports.ElementRef = ElementRef;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudF9yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkaWZmaW5nX3BsdWdpbl93cmFwcGVyLW91dHB1dF9wYXRoLUZJREpaYU85LnRtcC9hbmd1bGFyMi9zcmMvY29yZS9saW5rZXIvZWxlbWVudF9yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHO0FBQ0gsMkVBQTJFO0FBQzNFLDJGQUEyRjtBQUMzRiw2Q0FBNkM7QUFDN0M7SUFzQkUsb0JBQVksYUFBa0I7UUFBSSxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztJQUFDLENBQUM7SUFDekUsaUJBQUM7QUFBRCxDQUFDLEFBdkJELElBdUJDO0FBdkJZLGtCQUFVLGFBdUJ0QixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIGEgbmF0aXZlIGVsZW1lbnQgaW5zaWRlIG9mIGEgVmlldy5cbiAqXG4gKiBBbiBgRWxlbWVudFJlZmAgaXMgYmFja2VkIGJ5IGEgcmVuZGVyLXNwZWNpZmljIGVsZW1lbnQuIEluIHRoZSBicm93c2VyLCB0aGlzIGlzIHVzdWFsbHkgYSBET01cbiAqIGVsZW1lbnQuXG4gKi9cbi8vIE5vdGU6IFdlIGRvbid0IGV4cG9zZSB0aGluZ3MgbGlrZSBgSW5qZWN0b3JgLCBgVmlld0NvbnRhaW5lcmAsIC4uLiBoZXJlLFxuLy8gaS5lLiB1c2VycyBoYXZlIHRvIGFzayBmb3Igd2hhdCB0aGV5IG5lZWQuIFdpdGggdGhhdCwgd2UgY2FuIGJ1aWxkIGJldHRlciBhbmFseXNpcyB0b29sc1xuLy8gYW5kIGNvdWxkIGRvIGJldHRlciBjb2RlZ2VuIGluIHRoZSBmdXR1cmUuXG5leHBvcnQgY2xhc3MgRWxlbWVudFJlZiB7XG4gIC8qKlxuICAgKiBUaGUgdW5kZXJseWluZyBuYXRpdmUgZWxlbWVudCBvciBgbnVsbGAgaWYgZGlyZWN0IGFjY2VzcyB0byBuYXRpdmUgZWxlbWVudHMgaXMgbm90IHN1cHBvcnRlZFxuICAgKiAoZS5nLiB3aGVuIHRoZSBhcHBsaWNhdGlvbiBydW5zIGluIGEgd2ViIHdvcmtlcikuXG4gICAqXG4gICAqIDxkaXYgY2xhc3M9XCJjYWxsb3V0IGlzLWNyaXRpY2FsXCI+XG4gICAqICAgPGhlYWRlcj5Vc2Ugd2l0aCBjYXV0aW9uPC9oZWFkZXI+XG4gICAqICAgPHA+XG4gICAqICAgIFVzZSB0aGlzIEFQSSBhcyB0aGUgbGFzdCByZXNvcnQgd2hlbiBkaXJlY3QgYWNjZXNzIHRvIERPTSBpcyBuZWVkZWQuIFVzZSB0ZW1wbGF0aW5nIGFuZFxuICAgKiAgICBkYXRhLWJpbmRpbmcgcHJvdmlkZWQgYnkgQW5ndWxhciBpbnN0ZWFkLiBBbHRlcm5hdGl2ZWx5IHlvdSB0YWtlIGEgbG9vayBhdCB7QGxpbmsgUmVuZGVyZXJ9XG4gICAqICAgIHdoaWNoIHByb3ZpZGVzIEFQSSB0aGF0IGNhbiBzYWZlbHkgYmUgdXNlZCBldmVuIHdoZW4gZGlyZWN0IGFjY2VzcyB0byBuYXRpdmUgZWxlbWVudHMgaXMgbm90XG4gICAqICAgIHN1cHBvcnRlZC5cbiAgICogICA8L3A+XG4gICAqICAgPHA+XG4gICAqICAgIFJlbHlpbmcgb24gZGlyZWN0IERPTSBhY2Nlc3MgY3JlYXRlcyB0aWdodCBjb3VwbGluZyBiZXR3ZWVuIHlvdXIgYXBwbGljYXRpb24gYW5kIHJlbmRlcmluZ1xuICAgKiAgICBsYXllcnMgd2hpY2ggd2lsbCBtYWtlIGl0IGltcG9zc2libGUgdG8gc2VwYXJhdGUgdGhlIHR3byBhbmQgZGVwbG95IHlvdXIgYXBwbGljYXRpb24gaW50byBhXG4gICAqICAgIHdlYiB3b3JrZXIuXG4gICAqICAgPC9wPlxuICAgKiA8L2Rpdj5cbiAgICovXG4gIHB1YmxpYyBuYXRpdmVFbGVtZW50OiBhbnk7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlRWxlbWVudDogYW55KSB7IHRoaXMubmF0aXZlRWxlbWVudCA9IG5hdGl2ZUVsZW1lbnQ7IH1cbn1cbiJdfQ==