Ext.define('Optima5.Modules.Spec.DbsPeople.CfgParamButton' ,{
	extend: 'Ext.button.Button',
	
	initComponent: function() {
		Ext.apply(this,{
			menu: {
				xtype:'menu',
				items:[Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamTree',{
					optimaModule: this.optimaModule,
					cfgParam_id: this.cfgParam_id,
					width:250,
					height:300,
					listeners: {
						change: {
							fn: function(){
								this.onChange() ;
							},
							scope: this
						}
					}
				})]
			}
		});
		
		this.baseText = this.text ;
		
		this.callParent() ;
	},
	onChange: function() {
		var cfgParamTree = this.menu.down('treepanel'),
			selectedValue = cfgParamTree.getValue() ;
		if( selectedValue == null ) {
			this.removeCls( 'op5-spec-dbspeople-cfgparambtn-bold' ) ;
			this.setText( this.baseText ) ;
		} else {
			this.addCls( 'op5-spec-dbspeople-cfgparambtn-bold' ) ;
			this.setText( cfgParamTree.getStore().getNodeById(selectedValue).get('nodeText') ) ;
		}
		
		this.fireEvent('change',selectedValue) ;
	},
	getValue: function() {
		var cfgParamTree = this.menu.down('treepanel'),
			selectedValue = cfgParamTree.getValue() ;
		return selectedValue ;
	}
}) ;