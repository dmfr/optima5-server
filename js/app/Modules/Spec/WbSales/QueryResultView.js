Ext.define('Optima5.Modules.Spec.WbSales.QueryResultView',{
	extend: 'Ext.panel.Panel',

	initComponent: function() {
		
		var tplData = {
			modePreview: this.modePreview,
			tableRows: []
		} ;
		var queryVars = this.data.query_vars ;
		if( queryVars['time_mode'] ) {
			var timeTxt = '' ;
			switch( queryVars['time_mode'] ) {
				case 'MONTH' :
					timeTxt = 'Month to Date' ;
					break ;
				
				case 'CROP' :
					timeTxt = 'Crop to Date' ;
					break ;
				
				default :
					timeTxt = queryVars['date_start'] + ' ' + queryVars['date_end'] ;
					break ;
			}
			tplData.tableRows.push({
				fieldLabel: 'Time mode',
				fieldValue: timeTxt
			}) ;
		}
		if( queryVars['customer_text'] ) {
			tplData.tableRows.push({
				fieldLabel: 'Customer/Stores',
				fieldValue: queryVars['customer_text']
			}) ;
		}
		if( queryVars['treeview_mode'] ) {
			tplData.tableRows.push({
				fieldLabel: 'Treeview',
				fieldValue: queryVars['treeview_mode']
			}) ;
		}
		
		Ext.apply(this,{
			layout: {
				type:'vbox',
				align:'stretch'
			},
			items:[{
				xtype:'component',
				tpl:[
					'<div class="op5-spec-mrfoxy-statresult-wrap">',
					'<div class="op5-spec-mrfoxy-statresult">',
						'<div class="op5-spec-mrfoxy-statresult-table">',
							'<table class="op5-spec-mrfoxy-statresult-tbl" cellpadding="0" cellspacing="0">',
							'<tpl for="tableRows">',
								'<tr>',
									'<td class="op5-spec-mrfoxy-statresult-tdlabel">{fieldLabel}</td>',
									'<td class="op5-spec-mrfoxy-statresult-tdvalue">{fieldValue}</td>',
								'</tr>',
							'</tpl>',
							'</table>',
						'</div>',
						'<div class="op5-spec-mrfoxy-statresult-icon"></div>',
						'<tpl if="modePreview">',
							'<div class="op5-spec-mrfoxy-statresult-savebtn"></div>',
						'</tpl>',
					'</div>',
					'</div>'
				],
				cls: 'ux-noframe-bg',
				data: tplData,
				height: 72,
				listeners: {
					afterrender: function(cmp) {
						var btnSaveEl = Ext.get(cmp.getEl().down('div.op5-spec-mrfoxy-statresult-savebtn')) ;
						if( btnSaveEl ) {
							btnSaveEl.on('click',this.onBtnSave,this) ;
						}
					},
					scope: this
				}
			},this.buildResultPanel( this.data.result_tab )]
		}) ;
		
		this.callParent() ;
	},
	
	buildResultPanel: function( tabData ) {
		var me = this ;
		
		Optima5.Modules.CrmBase.QueryTemplateManager.loadStyle(me.optimaModule);
		
		var getRowClassFn = function(record,index) {
			var cssClasses = [] ;
			
			if( record.get('detachedRow') ) {
				cssClasses.push('op5crmbase-detachedrow') ;
			}
			
			return cssClasses.join(' ') ;
		} ;
		
		var columns = [] ;
		var fields = [{
			name:'_rowIdx', // server-side rowIdx ( ie related to row_pivotMap )
			type:'int'
		},{
			name:'_id',     // node "_id" (not used here but server available)
			type:'string'
		},{
			name:'_tdCls',     // node "_id" (not used here but server available)
			type:'string'
		}] ;
		Ext.Array.each(tabData.columns, function(columnDef,colIdx) {
			if( columnDef.text_bold == true ) {
				columnDef.text = ''+columnDef.text+'' ;
				columnDef.style = 'font-weight:bold' ;
			}
			if( columnDef.text_italic == true ) {
				columnDef.text = ''+columnDef.text+'' ;
			}
			if( columnDef.is_bold == true ) {
				Ext.apply(columnDef,{
					renderer: function(value,metaData,record) {
						if( record.get('detachedRow') ) {
							return ''+value+'' ;
						} else {
							return ''+value+'' ;
						}
					}
				}) ;
			}
			else if( columnDef.detachedColumn == true ) {
				Ext.apply(columnDef,{
					tdCls: 'op5crmbase-detachedcolumn'
				}) ;
			}
			else if( columnDef.progressColumn == true ) {
				Ext.apply(columnDef,{
					tdCls: 'op5crmbase-progresscolumn',
					renderer: function(value,meta) {
						if( value > 0 ) {
							meta.tdCls = 'op5crmbase-progresscell-pos' ;
							return '+ '+Math.abs(value) ;
						} else if( value < 0 ) {
							meta.tdCls = 'op5crmbase-progresscell-neg' ;
							return '- '+Math.abs(value) ;
						} else if( value==='' ) {
							return '' ;
						} else {
							return '=' ;
						}
					}
				}) ;
			}
			else {
				Ext.apply(columnDef,{
					tdCls: 'op5crmbase-datacolumn'
				}) ;
			}
			
			if( columnDef.dataIndex.substr(0,8) == 'valueCol' ) {
				Ext.apply(columnDef,{
					align: 'right',
					xtype: 'numbercolumn',
					format: '0,0'
				}) ;
				columnDef.tdCls = columnDef.tdCls || '' ;
				if( columnDef.text.indexOf('Almonds') > -1 ) {
					columnDef.tdCls += ' op5-spec-wbsales-alm' ;
				}
				if( columnDef.text.indexOf('Pistachios') > -1 ) {
					columnDef.tdCls += ' op5-spec-wbsales-pis' ;
				}
				if( columnDef.text.indexOf('POM') > -1 ) {
					columnDef.tdCls += ' op5-spec-wbsales-pom' ;
				}
			}
			
			Ext.applyIf(columnDef,{
				align:''
			});
			if( !columnDef.invisible ) {
				columns.push(columnDef);
			}
			
			fields.push({
				name:columnDef.dataIndex,
				type:columnDef.dataType
			});
		},me);
			
		var tmpModelName = 'QueryResultModel-' + me.getId() ;
		//console.log('Defining a model '+tmpModelName) ;
		Ext.define(tmpModelName, {
			extend: 'Ext.data.Model',
			fields: fields
		});
		
		Ext.apply( columns[0], {
			xtype: 'treecolumn'
		}) ;
		
		var tabgrid = Ext.create('Ext.tree.Panel',{
			border:false,
			flex: 1,
			cls:'op5crmbase-querygrid-'+me.optimaModule.sdomainId,
			store: {
				model: tmpModelName,
				nodeParam: '_id',
				folderSort: true,
				root: tabData.data_root,
				clearOnLoad: true
			},
			useArrows: false,
			rootVisible: false,
			multiSelect: false,
			singleExpand: false,
			// viewConfig:{toggleOnDblClick: false},
			columns: columns,
			plugins: [Ext.create('Ext.ux.ColumnAutoWidthPlugin', {allColumns:true, minAutoWidth:90, singleOnly:true})],
			viewConfig: { 
				//stripeRows: false,
				preserveScrollOnRefresh: true,
				getRowClass: function(record) {
					while( true ) {
						if( record.data._id == null ) {
							return '' ;
						}
						var tId = record.data._id ;
						if( tId.indexOf('ALMONDS') > -1 ) {
							return ' op5-spec-wbsales-alm' ;
						}
						if( tId.indexOf('PISTACHIOS') > -1 ) {
							return ' op5-spec-wbsales-pis' ;
						}
						if( tId.indexOf('POM') > -1 ) {
							return ' op5-spec-wbsales-pom' ;
						}
						if( (record = record.parentNode) ) {
							continue ;
						}
						break ;
					}
					return '' ;
				}
			}
		}) ;
		
		return tabgrid ;
	},
	
	
	getData: function() {
		var returnData = Ext.clone(this.data) ;
		Ext.apply(returnData,{
			title: this.title
		}) ;
		return returnData ;
	},
	
	onBtnSave: function() {
		this.fireEvent('savepreview',this.data) ;
	}
}) ;