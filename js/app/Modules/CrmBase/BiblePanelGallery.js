Ext.define('Optima5.Modules.CrmBase.BiblePanelGallery',{
	extend : 'Ext.panel.Panel',
	
	requires : ['Ext.Img','Ext.ux.dams.FileDownloader'],
			  
	alias : 'widget.op5crmbasebiblegallery',
			  
	storeKeyField : 'entry_key',
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:FilePanelGallery','No module reference ?') ;
		}
		
		var prepareDataFields = [] ;
		Ext.Array.each( this.gridCfg.entry_fields, function(field) {
			if( field.entry_field_code.indexOf('field_') != 0 ) {
				return ;
			}
			if( !field.entry_field_is_header ) {
				return ;
			}
			prepareDataFields.push({
				field: field.entry_field_code,
				bold: field.entry_field_is_key
			}) ;
		}) ;
		
		Ext.apply( me, {
			layout: 'fit',
			items: [{
				xtype: 'dataview',
				store: me.store,
				scrollable: true,
				tpl:[
					'<tpl for=".">',
						'<div class="thumb-box">',
								'<a href="#{id}">',
									'<tpl if="!thumb_blank">',
									'<img src="{thumb_url}">',
									'</tpl>',
								'</a>',
								'<div>{thumb_caption}</div>',
						'</div>',
					'</tpl>',
					'<div class="x-clear"></div>'
				],
				trackOver: true,
				overItemCls: 'x-item-over',
				itemSelector: 'div.thumb-box',
				emptyText: 'No images to display',
				prepareDataFields: prepareDataFields,
				prepareData: function(data) {
					var getParams = me.optimaModule.getConfiguredAjaxParams() ;
					Ext.apply( getParams, {
						media_id: data.media_id,
						thumb: true
					});
					
					var arrThumbCaption = [], line ;
					Ext.Array.each( this.prepareDataFields, function(field) {
						line = data[field.field] ;
						if( field.bold ) {
							line = '<b>'+line+'</b>' ;
						}
						arrThumbCaption.push(line) ;
					});
					
					Ext.apply(data, {
						thumb_url: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams),
						thumb_blank: !data.media_id,
						thumb_caption: arrThumbCaption.join('<br>')
					});
					return data;
				},
				listeners: {
					itemdblclick: {
						fn:function(view, record, item, index, event) {
							me.fireEvent('editentryupdate',record.get(this.storeKeyField)) ;
						},
						scope:me
					}
				}
			}]
		}) ;
		
		me.callParent() ;
	}
}) ;