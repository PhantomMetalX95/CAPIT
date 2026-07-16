export default {
  name: 'product',
  title: 'Atelier Products',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Product Name',
      type: 'string',
      validation: Rule => Rule.required().warning('Provide a distinct luxury name.')
    },
    {
      name: 'price',
      title: 'Price (KES)',
      type: 'number',
      description: 'Price in Kenyan Shillings (KSh). Ensure this is entered as a raw number.',
      validation: Rule => Rule.required().min(0)
    },
    {
      name: 'image',
      title: 'Product Image',
      type: 'image',
      options: {
        hotspot: true, // Allows editorial crop control in Sanity Studio
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      description: 'A brief, evocative hook about the piece.'
    },
    {
      name: 'designDetails',
      title: 'Design Details',
      type: 'text',
      rows: 3,
      description: 'Material lists, custom hardware parameters, and craftsmanship features.'
    },
    {
      name: 'stylingRecommendation',
      title: 'Styling Recommendation',
      type: 'text',
      rows: 3,
      description: 'Pairing instructions and advice directly from the Creative Director.'
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Use lowercase tags like "caps", "beanies", or "buckets" for Cap It, and "necklaces" or "bracelets" for Beads & Beyond.',
      validation: Rule => Rule.required()
    },
    {
      name: 'brand',
      title: 'Brand / Atelier Line',
      type: 'string',
      options: {
        list: [
          { title: 'Cap It', value: 'capit' },
          { title: 'Beads & Beyond', value: 'beads' }
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'stock',
      title: 'Stock Inventory',
      type: 'number',
      description: 'Current available quantity. Set to 0 to activate the "Sold Out" state automatically.',
      validation: Rule => Rule.required().min(0).integer()
    }
  ]
}