Ext.define('DbsPeopleRealConfirmModel',{
	extend: 'Ext.data.Model',
	fields:[
		{name:'checked', type:'boolean'},
		{name:'exception_type', type:'string'},
		{name:'people_name', type:'string'},
		{name:'exception_txt', type:'string'},
		{name:'ceq_show', type:'boolean'},
		{name:'ceq_error', type:'boolean'},
		{name:'rh_show', type:'boolean'},
		{name:'rh_error', type:'boolean'},
		{name:'_error', type:'boolean'}
	]
}) ;

Ext.define('Optima5.Modules.Spec.DbsPeople.RealConfirmPanel',{
	extend:'Ext.panel.Panel',
	
	editDisabled: null,

	initComponent: function() {
		var me = this ;
		Ext.apply( me, {
			layout:{
				type:'vbox',
				align:'stretch'
			},
			frame: true,
			items:[ me.initHeaderCfg(), {
				xtype:'grid',
				hidden: true,
				height: 200,
				columns: {
					defaults:{
						menuDisabled: true,
						draggable: false,
						sortable: false,
						hideable: false,
						resizable: false,
						groupable: false,
						lockable: false
					},
					items:[{
						xtype: 'checkcolumn',
						dataIndex: 'checked',
						width: 32,
						listeners: {
							checkchange: function(checkCol, rowIdx) {
								var view = this.down('grid').getView(),
									viewNode = view.getNode(rowIdx),
									record = view.getRecord(viewNode) ;
								if( record.get('_error') ) {
									record.set('checked',false) ;
								}
							},
							scope: this
						}
					},{
						dataIndex: 'people_name',
						text: 'Nom / Prénom',
						width: 150
					},{
						dataIndex: 'exception_type',
						width: 32,
						renderer: function(value,metaData,record) {
							var tdCls = 'op5-spec-dbspeople-realvalidgrid-tdcolor' ;
							tdCls += ' ' ;
							tdCls += 'op5-spec-dbspeople-realvalidgrid-tdcolor-' + value.replace(/[^a-zA-Z0-9]/g, '') ;
							metaData.tdCls += tdCls ;
							return '' ;
						}
					},{
						dataIndex: 'exception_txt',
						text: 'Nature exception',
						flex:1
					}]
					
				},
				store: {
					model: 'DbsPeopleRealConfirmModel',
					data: []
				},
				viewConfig: {
					getRowClass: function(record) {
						if( record.get('_error') ) {
							return 'op5-spec-dbspeople-realvalidgrid-error' ;
						}
						return '' ;
					}
				}
			}],
			buttons:[{
				itemId: 'btnSubmit',
				text: 'Validation',
				handler: function() {
					this.onSubmit() ;
				},
				scope: this
			}]
		});
		
		this.callParent() ;
		
		if( this.cfgData ) {
			var headerCmp = this.down('#pHeader') ;
			headerCmp.update(this.cfgData) ;
			if( headerCmp.rendered ) {
				me.headerAttachEvents() ;
			} else {
				headerCmp.on('afterrender',function() {
					me.headerAttachEvents() ;
				},me) ;
			}
			
			if( !Ext.isEmpty(this.cfgData.exception_rows) ) {
				this.down('grid').setVisible(true) ;
				this.down('grid').getStore().loadData( this.cfgData.exception_rows ) ;
				
				var disableBtn = false ;
				this.down('grid').getStore().each( function(record) {
					if( this.cfgData.actionDay == 'valid_ceq' && record.get('ceq_error') ) {
						disableBtn = true ;
						record.set('_error',true) ;
					}
					if( this.cfgData.actionDay == 'valid_rh' && record.get('rh_error') ) {
						disableBtn = true ;
						record.set('_error',true) ;
					}
				},this) ;
				this.down('grid').headerCt.down('[dataIndex="checked"]').setVisible( this.cfgData.actionDay=='valid_ceq' ) ;
				if( disableBtn ) {
					this.down('#btnSubmit').setVisible(false) ;
				}
				
				switch( this.cfgData.actionDay ) {
					case 'valid_ceq' :
						this.down('grid').getStore().filter('ceq_show',true) ;
						break ;
					case 'valid_rh' :
						this.down('grid').getStore().filter('rh_show',true) ;
						break ;
				}
			}
		}
	},
	initHeaderCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			tpl: [
				'<div class="op5-spec-dbspeople-realvalidhdr">',
					'<div class="op5-spec-dbspeople-realvalidhdr-inline-tbl">',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem op5-spec-dbspeople-realvalidhdr-icon">',
						'</div>',
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem">',
							'<table class="op5-spec-dbspeople-realvalidhdr-tbl">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Date :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{date_sql}</td>',
							'</tr>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Entrepôt :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{filter_site_txt}</td>',
							'</tr>',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Equipe :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{filter_team_txt}</td>',
							'</tr>',
							'</table>',
						'</div>',
						
						'<div class="op5-spec-dbspeople-realvalidhdr-inline-elem">',
							'<table class="op5-spec-dbspeople-realvalidhdr-tbl">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Nb "people" :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue">{people_count}</td>',
							'</tr>',
							'<tpl if="exception_rows">',
							'<tr>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdlabel">Nb exceptions :</td>',
								'<td class="op5-spec-dbspeople-realvalidhdr-tdvalue op5-spec-dbspeople-realvalidhdr-exception">{[this.getExceptionsCount(values)]}</td>',
							'</tr>',
							'</tpl>',
							'</table>',
						'</div>',
					'</div>',
			  
					'<div class="op5-spec-mrfoxy-promoformheader-actions">',
						'<tpl if="this.isValidRh(values)">',
						'<div class="op5-spec-mrfoxy-promoformheader-action-btn op5-spec-mrfoxy-promoformheader-action-btn-save">',
						'</div>',
						'</tpl>',
					'</div>',
				'</div>',
				{
					disableFormats: true,
					getExceptionsCount: function( values ) {
						var cnt = 0 ;
						Ext.Array.each( values.exception_rows, function(exception_row) {
							switch( values.actionDay ) {
								case 'valid_ceq' :
									if( !exception_row.ceq_show ) {
										return ;
									}
									break ;
								case 'valid_rh' :
									if( !exception_row.rh_show ) {
										return ;
									}
									break ;
							}
							cnt++ ;
						}) ;
						return cnt ;
					},
					isValidRh: function( values ) {
						return (values.actionDay=='valid_rh') ;
					}
				}
			]
		} ;
		
		return headerCfg ;
	},
	headerAttachEvents: function() {
		var me=this,
			headerCmp = me.getComponent('pHeader'),
			headerEl = headerCmp.getEl(),
			btnSaveEl = headerEl.down('.op5-spec-mrfoxy-promoformheader-action-btn-save') ;
		
		if( btnSaveEl ) {
			btnSaveEl.un('click',me.onExport,me) ;
			btnSaveEl.on('click',me.onExport,me) ;
		}
	},
	
	onSubmit: function() {
		if( this.down('grid').headerCt.down('[dataIndex="checked"]').isVisible() ) {
			var allChecked = true ;
			this.down('grid').getStore().each( function(rec) {
				if( !rec.get('checked') ) {
					allChecked = false ;
				}
			}) ;
			if( !allChecked ) {
				Ext.MessageBox.alert('Confirmation','Veuillez valider toutes les exceptions') ;
				return ;
			}
		}
		this.fireEvent('submit',this) ;
	},
	onExport: function() {
		var exportParams = this.parentRealPanel.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_dbs_people',
			_action: 'query_exportXLS',
			data: Ext.JSON.encode([this.getExportData()])
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	getExportData: function() {
		var queryVars = {
			q_name:'Validation RH / Exceptions',
			fields: [{
				fieldLabel: 'Date',
				fieldValue: this.cfgData.date_sql
			},{
				fieldLabel: 'Entrepôt',
				fieldValue: this.cfgData.filter_site_txt
			},{
				fieldLabel: 'Equipe',
				fieldValue: this.cfgData.filter_team_txt
			}]
		},
		columns=[],
		data= Ext.Array.pluck( this.down('grid').getStore().getRange(), 'data' ) ;
		
		Ext.Object.each({
			people_name: 'People Nom',
			exception_type: 'Type exception',
			exception_txt: 'Détail'
		}, function(mkey,mtxt){
			columns.push({
				dataIndex: mkey,
				dataType: 'string',
				text: mtxt
			});
		});
		
		return {
			query_vars: queryVars,
			result_tab: {
				columns: columns,
				data: data
			}
		};
	}
}) ;