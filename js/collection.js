/* ENLUX collection data.
 *
 * While this list is empty the product grid stays hidden and the Collection
 * section reads as a brand teaser (chapters + enquiry CTA). Add real products
 * here and the grid renders itself under the chapters, no HTML changes needed:
 *
 *   {
 *     name: "Product name",                       // required
 *     image: "images/collection/product.jpg",     // required, ideally 4:5, ~1000px wide
 *     alt: "Short description of the photo",      // recommended
 *     price: "₦00,000",                           // optional, shown as written
 *     description: "One short line."              // optional
 *   }
 *
 * Each card gets an "Order" link that opens an email to ENLUX with the
 * product name in the subject line.
 */
window.ENLUX_COLLECTION = [];
