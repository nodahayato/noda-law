module.exports = {
  siteMetadata: {
    title: `研究ノート`,
    description: `研究ノートと未確定原稿の置場です。弁護士兼社会人博士後期課程学生をしている野田隼人が書いた物を置いています。`,
    author: `野田隼人`,
    siteUrl: `https://noda.law`,
    social: {
      twitter: `nodahayato`,
      facebook: ``,
      github: `nodahayato`,
      linkedin: `nodahayato`,
      email: `nodah@locolo.jp`,
    },
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 970,
	      withWebp: true,
	      withAvif: true,
            },
          },
          {
            resolve: `gatsby-remark-katex`,
            options: {
              strict: `warn`,
            },
          },
          {
            resolve: `gatsby-remark-copy-linked-files`,
            options: {
              destinationDir: `files`,
              ignoreFileExtensions: [`png`, `jpg`, `jpeg`, `bmp`, `tiff`],
            },
          },
          `gatsby-remark-prismjs`,
        ],
      },
    },
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    // uncomment this and input the trackingId to enable google analytics
    // {
    // resolve: `gatsby-plugin-google-analytics`,
    // options: {
    // trackingId: `ADD YOUR TRACKING ID HERE`,
    // },
    // },
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        feeds: [{
          serialize: ({ query: { site, allMarkdownRemark } }) =>
            allMarkdownRemark.edges.map(({ node }) => {
              const url = new URL(node.fields.slug, site.siteMetadata.siteUrl).href
              return {
                title: node.frontmatter.title,
                date: node.frontmatter.date,
                description: node.excerpt,
                url,
                guid: url,
                custom_elements: [{ 'content:encoded': node.html }],
              }
            }),
          query: `{
            allMarkdownRemark(limit: 1000, sort: { fields: [frontmatter___date], order: DESC }) {
              edges {
                node {
                  frontmatter { title date }
                  fields { slug }
                  excerpt
                  html
                }
              }
            }
          }`,
          output: `/rss.xml`,
          title: `研究ノート RSS`,
        }],
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `flexible-gatsby-starter`,
        short_name: `flexible-gatsby`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `./static/gatsby-icon.png`, // This path is relative to the root of the site.
      },
    },
    // `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-sass`,
  ],
}
